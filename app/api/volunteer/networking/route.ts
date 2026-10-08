import { NextResponse } from 'next/server';
import { getSession, hasRole } from '@/lib/session';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const session = getSession(req);
    if (!hasRole(session, ['volunteer', 'admin']) || !session.id) {
        return NextResponse.json({ success: false, error: 'Volunteer or Admin authentication required.' }, { status: 401 });
    }

    try {
        const body = await req.json() as { teamId?: string; memberId?: string };
        const teamId = body.teamId?.trim().toUpperCase();
        const memberId = body.memberId?.trim();

        if (!teamId || !memberId) {
            return NextResponse.json({ success: false, error: 'Invalid individual pass scanned.' }, { status: 400 });
        }

        const { data: team, error: fetchErr } = await supabase
            .from('registrations')
            .select('team_id, team_name, members, raw_data, is_checked_in')
            .or(`team_id.ilike.${teamId},transaction_id.ilike.${teamId}`)
            .single();

        if (fetchErr || !team) {
            return NextResponse.json({ success: false, error: 'Team not found in database.' }, { status: 404 });
        }

        if (!team.is_checked_in) {
            return NextResponse.json({ 
                success: true, 
                result: { status: 'NEEDS_CHECKIN', teamId: team.team_id, teamName: team.team_name } 
            });
        }

        // Find the member name
        let memberName = 'Participant';
        if (Array.isArray(team.members)) {
            const member = team.members.find(m => m.participant_id === memberId || m.id === memberId);
            if (member) memberName = member.fullName || member.name || 'Participant';
        }

        const rawData = typeof team.raw_data === 'object' && team.raw_data !== null ? (team.raw_data as any) : {};
        const networkingClaimed = Array.isArray(rawData.networking_claimed) ? rawData.networking_claimed : [];
        const mealAccess = typeof team.meal_access === 'object' && team.meal_access !== null ? team.meal_access : {};
        const networkingPasses = Array.isArray((mealAccess as any).networking_passes) ? (mealAccess as any).networking_passes : [];
        const isAll = networkingPasses.includes('all');
        const hasMemberAccess = networkingPasses.includes(memberId) || (Array.isArray(team.members) && team.members.find(m => m.id === memberId || m.participant_id === memberId)?.networking_pass === true);

        if (!isAll && !hasMemberAccess) {
             return NextResponse.json({ 
                success: true, 
                result: { status: 'NOT_INCLUDED', teamId: team.team_id, teamName: team.team_name, memberName } 
            });
        }

        // Check if they already checked into the networking event
        if (networkingClaimed.includes(memberId)) {
            return NextResponse.json({ 
                success: true, 
                result: { status: 'ALREADY_CLAIMED', teamId: team.team_id, teamName: team.team_name, memberName } 
            });
        }

        // Update networking_claimed
        networkingClaimed.push(memberId);
        rawData.networking_claimed = networkingClaimed;
        
        const { error: updateErr } = await supabase
            .from('registrations')
            .update({ raw_data: rawData })
            .eq('team_id', team.team_id);

        if (updateErr) throw updateErr;

        return NextResponse.json({ 
            success: true, 
            result: { 
                status: 'PERMITTED',
                teamId: team.team_id,
                teamName: team.team_name,
                memberName,
                mealLabel: 'Networking'
            } 
        });

    } catch (error) {
        console.error('Networking scan failed:', error);
        return NextResponse.json({ success: false, error: 'Could not process networking scan.' }, { status: 500 });
    }
}
