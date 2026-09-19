import { NextResponse } from 'next/server';
import { teamSupabase as supabase } from '@/lib/supabase';

/**
 * Merge multiple registrations into one new team.
 *
 * POST body: { sourceTeamIds: string[], newTeamName: string, track?: string }
 *
 * Steps:
 *  1. Fetch all source registrations
 *  2. Combine members into one array
 *  3. Determine entry_type from combined count
 *  4. Generate new team_id and password
 *  5. Insert the merged registration
 *  6. Mark old registrations as MERGED
 */

function generatePasswordFromMembers(members: any[], teamNum: number, entryType: string): string {
    const initials = members
        .map((m: any) => {
            const name: string = typeof m === 'string' ? m : (m.fullName || m.name || '');
            return name.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase();
        })
        .filter(Boolean)
        .join('-');

    let prefix = 'HB';
    if (entryType === 'INDIVIDUAL') prefix += '-IND';
    else if (entryType === 'DUO') prefix += '-DUO';
    else if (entryType === 'SQUAD') prefix += '-SQD';
    else prefix += '-TEAM';

    return `${initials}@${prefix}-${teamNum}`;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { sourceTeamIds, newTeamName, track } = body;

        if (!sourceTeamIds || !Array.isArray(sourceTeamIds) || sourceTeamIds.length < 2) {
            return NextResponse.json(
                { error: 'At least 2 source teams are required' },
                { status: 400 }
            );
        }

        if (!newTeamName || !newTeamName.trim()) {
            return NextResponse.json(
                { error: 'New team name is required' },
                { status: 400 }
            );
        }

        // 1. Fetch all source registrations
        const { data: sourceTeams, error: fetchError } = await supabase
            .from('registrations')
            .select('*')
            .in('transaction_id', sourceTeamIds);

        if (fetchError) {
            console.error('❌ Merge fetch error:', fetchError);
            return NextResponse.json(
                { error: 'Failed to fetch source teams', details: fetchError.message },
                { status: 500 }
            );
        }

        if (!sourceTeams || sourceTeams.length < 2) {
            return NextResponse.json(
                { error: `Only found ${sourceTeams?.length || 0} of ${sourceTeamIds.length} teams. Make sure the IDs are valid.` },
                { status: 400 }
            );
        }

        // 2. Combine all members
        const allMembers: any[] = [];
        for (const team of sourceTeams) {
            const members = Array.isArray(team.members) ? team.members : [];
            allMembers.push(...members);
        }

        if (allMembers.length === 0) {
            return NextResponse.json(
                { error: 'No members found in the selected teams' },
                { status: 400 }
            );
        }

        // 3. Determine entry_type
        const count = allMembers.length;
        let entryType = 'INDIVIDUAL';
        if (count === 2) entryType = 'DUO';
        if (count > 2) entryType = 'SQUAD';

        // 4. Generate new team_id
        const { data: allRegs } = await supabase
            .from('registrations')
            .select('team_id');

        let maxNum = 100;
        if (allRegs) {
            for (const r of allRegs) {
                if (!r.team_id) continue;
                const parts = r.team_id.split('-');
                const num = parseInt(parts[parts.length - 1]);
                if (!isNaN(num) && num > maxNum) maxNum = num;
            }
        }
        const newTeamNum = maxNum + 1;

        let teamIdPrefix = 'HB';
        if (entryType === 'INDIVIDUAL') teamIdPrefix += '-IND';
        else if (entryType === 'DUO') teamIdPrefix += '-DUO';
        else if (entryType === 'SQUAD') teamIdPrefix += '-SQD';
        else teamIdPrefix += '-TEAM';

        const newTeamId = `${teamIdPrefix}-${newTeamNum}`;
        const newPassword = generatePasswordFromMembers(allMembers, newTeamNum, entryType);

        // Use the first source team's track if none provided
        const finalTrack = track || sourceTeams[0].track || 'General';

        // Captain is the first member of the first source team
        const captain = allMembers[0];

        // 5. Insert new merged registration
        const { error: insertError } = await supabase
            .from('registrations')
            .insert({
                team_name: newTeamName.trim(),
                team_id: newTeamId,
                password: newPassword,
                track: finalTrack,
                entry_type: entryType,
                status: 'COMPLETED',
                members: allMembers,
                captain: typeof captain === 'string' ? captain : (captain.fullName || captain.name || ''),
                captain_mobile: typeof captain === 'string' ? '' : (captain.phone || ''),
                email: typeof captain === 'string' ? '' : (captain.email || ''),
                college: typeof captain === 'string' ? '' : (captain.college || ''),
                raw_data: {
                    mergedFrom: sourceTeamIds,
                    mergedAt: new Date().toISOString(),
                    originalTeams: sourceTeams.map((t: any) => ({
                        teamId: t.team_id,
                        teamName: t.team_name,
                        transactionId: t.transaction_id
                    }))
                },
                created_at: new Date().toISOString()
            });

        if (insertError) {
            console.error('❌ Merge insert error:', insertError);
            return NextResponse.json(
                { error: 'Failed to create merged team', details: insertError.message },
                { status: 500 }
            );
        }

        // 6. Mark old registrations as MERGED
        const { error: updateError } = await supabase
            .from('registrations')
            .update({ status: 'MERGED' })
            .in('transaction_id', sourceTeamIds);

        if (updateError) {
            console.error('⚠️ Failed to mark source teams as MERGED:', updateError);
        }

        // Update raw_data for each source team to record where they were merged
        for (const team of sourceTeams) {
            const existingRaw = team.raw_data || {};
            await supabase
                .from('registrations')
                .update({
                    raw_data: {
                        ...existingRaw,
                        mergedInto: newTeamId,
                        mergedAt: new Date().toISOString()
                    }
                })
                .eq('transaction_id', team.transaction_id);
        }

        return NextResponse.json({
            success: true,
            newTeamId,
            newTeamName: newTeamName.trim(),
            newPassword,
            memberCount: allMembers.length,
            mergedFrom: sourceTeamIds.length,
            message: `Successfully merged ${sourceTeamIds.length} registrations into "${newTeamName.trim()}" (${newTeamId})`
        });

    } catch (error: any) {
        console.error('❌ Merge teams error:', error);
        return NextResponse.json(
            { success: false, error: error.message || String(error) },
            { status: 500 }
        );
    }
}
