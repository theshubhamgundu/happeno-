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
            .select('team_id, team_name, members, meal_access, is_checked_in')
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

        // Check meal access
        const mealAccess = typeof team.meal_access === 'object' && team.meal_access !== null ? team.meal_access : {};
        const purchasedMeals = Array.isArray((mealAccess as any).purchased_meals) ? (mealAccess as any).purchased_meals : [];
        const dinnerClaimed = Array.isArray((mealAccess as any).dinner_claimed) ? (mealAccess as any).dinner_claimed : [];

        // Check if they actually purchased the meal pass
        if (!purchasedMeals.includes(memberId) && !purchasedMeals.includes('all')) {
            // Also check the global fallback just in case
            if (purchasedMeals.length < (team.members?.length || 999)) {
                return NextResponse.json({ 
                    success: true, 
                    result: { status: 'NOT_INCLUDED', teamId: team.team_id, teamName: team.team_name, memberName } 
                });
            }
        }

        // Check if they already claimed dinner
        if (dinnerClaimed.includes(memberId)) {
            return NextResponse.json({ 
                success: true, 
                result: { status: 'ALREADY_CLAIMED', teamId: team.team_id, teamName: team.team_name, memberName } 
            });
        }

        // Update dinner_claimed
        dinnerClaimed.push(memberId);
        
        const { error: updateErr } = await supabase
            .from('registrations')
            .update({
                meal_access: { ...mealAccess, dinner_claimed: dinnerClaimed }
            })
            .eq('team_id', team.team_id);

        if (updateErr) throw updateErr;

        return NextResponse.json({ 
            success: true, 
            result: { 
                status: 'PERMITTED',
                teamId: team.team_id,
                teamName: team.team_name,
                memberName,
                mealLabel: 'Dinner'
            } 
        });

    } catch (error) {
        console.error('Dinner scan failed:', error);
        return NextResponse.json({ success: false, error: 'Could not process dinner scan.' }, { status: 500 });
    }
}
