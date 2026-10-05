import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession, hasRole } from '@/lib/session';
import { randomBytes, randomUUID } from 'node:crypto';
import { hashPassword } from '@/lib/password';
import { MAX_TEAM_MEMBERS } from '@/lib/constants';

export async function POST(req: Request) {
    if (!hasRole(getSession(req), ['admin'])) {
        return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });
    }

    try {
        const { action, sourceTeamId, targetTeamId, finalSourceEmails, finalTargetEmails } = await req.json();

        if (!sourceTeamId || !Array.isArray(finalSourceEmails) || !Array.isArray(finalTargetEmails)) {
            return NextResponse.json({ error: 'Missing team IDs or finalized email arrays.' }, { status: 400 });
        }
        if (action !== 'SYNC' && action !== 'SPLIT') {
            return NextResponse.json({ error: 'Invalid action. Must be SYNC or SPLIT.' }, { status: 400 });
        }
        if (finalSourceEmails.length === 3 || finalTargetEmails.length === 3) {
            return NextResponse.json({ error: 'A team cannot have exactly 3 members.' }, { status: 400 });
        }
        if (finalSourceEmails.length > MAX_TEAM_MEMBERS || finalTargetEmails.length > MAX_TEAM_MEMBERS) {
            return NextResponse.json({ error: `A team cannot exceed ${MAX_TEAM_MEMBERS} members.` }, { status: 400 });
        }
        if (finalSourceEmails.length === 0 && finalTargetEmails.length === 0) {
            return NextResponse.json({ error: 'Cannot leave both teams empty.' }, { status: 400 });
        }

        // 1. Fetch Source Team
        const { data: sourceTeam, error: sourceError } = await supabase
            .from('registrations')
            .select('*')
            .eq('team_id', sourceTeamId)
            .single();

        if (sourceError || !sourceTeam) return NextResponse.json({ error: 'Source team not found.' }, { status: 404 });

        let allMembers = [...(sourceTeam.members || [])];
        let allMeals = { ...(sourceTeam.member_meal_state || {}) };
        
        let targetTeam = null;

        if (action === 'SYNC') {
            if (!targetTeamId) return NextResponse.json({ error: 'Destination team ID required for sync.' }, { status: 400 });
            if (targetTeamId === sourceTeamId) return NextResponse.json({ error: 'Cannot sync to the same team.' }, { status: 400 });

            // Fetch Target Team
            const { data: tTeam, error: tError } = await supabase
                .from('registrations')
                .select('*')
                .eq('team_id', targetTeamId)
                .single();

            if (tError || !tTeam) return NextResponse.json({ error: 'Destination team not found.' }, { status: 404 });
            targetTeam = tTeam;

            allMembers = [...allMembers, ...(tTeam.members || [])];
            allMeals = { ...allMeals, ...(tTeam.member_meal_state || {}) };
        }

        // Verify all emails exist in the combined pool
        const combinedEmails = [...finalSourceEmails, ...finalTargetEmails];
        const memberByEmail = new Map();
        for (const m of allMembers) {
            if (m.email) memberByEmail.set(m.email, m);
        }
        for (const email of combinedEmails) {
            if (!memberByEmail.has(email)) {
                return NextResponse.json({ error: `Member ${email} not found in either team.` }, { status: 400 });
            }
        }

        // Construct final member arrays
        const newSourceMembers = finalSourceEmails.map((e: string) => memberByEmail.get(e));
        const newTargetMembers = finalTargetEmails.map((e: string) => memberByEmail.get(e));
        
        // Construct final meal states
        const newSourceMeals: any = {};
        for (const e of finalSourceEmails) {
            if (allMeals[e]) newSourceMeals[e] = allMeals[e];
        }
        
        const newTargetMeals: any = {};
        for (const e of finalTargetEmails) {
            if (allMeals[e]) newTargetMeals[e] = allMeals[e];
        }

        // Entry Types
        const getType = (len: number) => len === 1 ? 'INDIVIDUAL' : len === 2 ? 'DUO' : 'SQUAD';

        if (action === 'SYNC') {
            // Update Target first
            if (newTargetMembers.length === 0) {
                await supabase.from('registrations').delete().eq('team_id', targetTeamId);
            } else {
                const cap = newTargetMembers[0];
                const { error: tErr } = await supabase.from('registrations').update({
                    members: newTargetMembers,
                    member_meal_state: newTargetMeals,
                    entry_type: getType(newTargetMembers.length),
                    captain: cap.fullName || cap.name || '',
                    captain_mobile: cap.phone || '',
                    email: cap.email || ''
                }).eq('team_id', targetTeamId);
                if (tErr) throw tErr;
            }

            // Update Source
            if (newSourceMembers.length === 0) {
                await supabase.from('registrations').delete().eq('team_id', sourceTeamId);
            } else {
                const cap = newSourceMembers[0];
                const { error: sErr } = await supabase.from('registrations').update({
                    members: newSourceMembers,
                    member_meal_state: newSourceMeals,
                    entry_type: getType(newSourceMembers.length),
                    captain: cap.fullName || cap.name || '',
                    captain_mobile: cap.phone || '',
                    email: cap.email || ''
                }).eq('team_id', sourceTeamId);
                if (sErr) throw sErr;
            }

            return NextResponse.json({ success: true, message: 'Successfully synchronized members between teams.' });

        } else if (action === 'SPLIT') {
            // Generate new team
            const { data: newId, error: idError } = await supabase.rpc('next_registration_team_id');
            if (idError || typeof newId !== 'string') throw idError || new Error('Could not reserve a new team ID.');
            
            const password = randomBytes(18).toString('base64url');
            const cap = newTargetMembers[0];

            // Insert new team
            const { error: insertErr } = await supabase.from('registrations').insert({
                transaction_id: randomUUID(),
                team_id: newId,
                team_name: `${sourceTeam.team_name} (Split)`,
                password_hash: await hashPassword(password),
                track: sourceTeam.track,
                track_preferences: sourceTeam.track_preferences,
                problem_statement: sourceTeam.problem_statement,
                meal_access: sourceTeam.meal_access,
                entry_type: getType(newTargetMembers.length),
                members: newTargetMembers,
                member_meal_state: newTargetMeals,
                captain: cap.fullName || cap.name || '',
                captain_mobile: cap.phone || '',
                email: cap.email || '',
                status: 'COMPLETED',
                raw_data: { split_from: sourceTeamId }
            });
            if (insertErr) throw insertErr;

            // Update source team
            if (newSourceMembers.length === 0) {
                await supabase.from('registrations').delete().eq('team_id', sourceTeamId);
            } else {
                const sCap = newSourceMembers[0];
                const { error: sErr } = await supabase.from('registrations').update({
                    members: newSourceMembers,
                    member_meal_state: newSourceMeals,
                    entry_type: getType(newSourceMembers.length),
                    captain: sCap.fullName || sCap.name || '',
                    captain_mobile: sCap.phone || '',
                    email: sCap.email || ''
                }).eq('team_id', sourceTeamId);
                if (sErr) throw sErr;
            }

            return NextResponse.json({ 
                success: true, 
                message: `Successfully split into new team: ${newId}`,
                newTeamId: newId,
                newPassword: password
            });
        }
        
    } catch (err: any) {
        console.error('Restructure Error:', err);
        return NextResponse.json({ error: err.message || 'An error occurred during restructuring.' }, { status: 500 });
    }
}
