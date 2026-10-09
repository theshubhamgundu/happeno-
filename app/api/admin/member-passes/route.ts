import { NextResponse } from 'next/server';
import { teamSupabase as supabase } from '@/lib/supabase';
import { getSession, hasRole } from '@/lib/session';

/**
 * POST /api/admin/member-passes
 * Toggle food pass or networking pass for individual team members.
 * Body: { teamId, participantId, passType: 'meal' | 'networking', enabled: boolean }
 */
export async function POST(req: Request) {
    if (!hasRole(getSession(req), ['admin'])) {
        return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { teamId, participantId, passType, enabled } = body;

        if (!teamId || !participantId || !passType || typeof enabled !== 'boolean') {
            return NextResponse.json({ error: 'Missing required fields: teamId, participantId, passType, enabled' }, { status: 400 });
        }

        const { data: team, error: fetchError } = await supabase
            .from('registrations')
            .select('transaction_id, team_id, meal_access, members')
            .eq('team_id', teamId.toUpperCase())
            .single();

        if (fetchError || !team) {
            return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
        }

        // Verify the participant_id actually belongs to this team
        const memberExists = team.members?.some((m: any, idx: number) => {
            const id = m.participant_id || m.id || `m${idx}`;
            return id === participantId;
        });
        if (!memberExists) {
            return NextResponse.json({ error: 'Participant not found in this team.' }, { status: 404 });
        }

        const mealAccess = team.meal_access || { purchased_meals: [], networking_passes: [] };

        // Normalize: if it was set to ['all'], expand it to all member IDs first
        const allMemberIds = (team.members || []).map((m: any, idx: number) => m.participant_id || m.id || `m${idx}`);

        if (passType === 'meal') {
            let currentMeals: string[] = Array.isArray(mealAccess.purchased_meals) ? mealAccess.purchased_meals : [];
            if (currentMeals.includes('all')) {
                currentMeals = [...allMemberIds];
            }

            if (enabled) {
                if (!currentMeals.includes(participantId)) {
                    currentMeals.push(participantId);
                }
            } else {
                currentMeals = currentMeals.filter((id: string) => id !== participantId);
            }
            mealAccess.purchased_meals = currentMeals;
        }

        if (passType === 'networking') {
            let currentPasses: string[] = Array.isArray(mealAccess.networking_passes) ? mealAccess.networking_passes : [];
            if (currentPasses.includes('all')) {
                currentPasses = [...allMemberIds];
            }

            if (enabled) {
                if (!currentPasses.includes(participantId)) {
                    currentPasses.push(participantId);
                }
            } else {
                currentPasses = currentPasses.filter((id: string) => id !== participantId);
            }
            mealAccess.networking_passes = currentPasses;
        }

        // Sync legacy boolean flags in the members array to prevent UI conflicts
        const updatedMembers = (team.members || []).map((m: any, idx: number) => {
            const id = m.participant_id || m.id || `m${idx}`;
            if (id === participantId) {
                if (passType === 'meal') m.meal_pass = enabled;
                if (passType === 'networking') m.networking_pass = enabled;
            }
            return m;
        });

        const { error: updateError } = await supabase
            .from('registrations')
            .update({ meal_access: mealAccess, members: updatedMembers })
            .eq('transaction_id', team.transaction_id);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, teamId: team.team_id, mealAccess });
    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Error.' }, { status: 503 });
    }
}
