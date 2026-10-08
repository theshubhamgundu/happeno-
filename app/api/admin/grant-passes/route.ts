import { NextResponse } from 'next/server';
import { teamSupabase as supabase } from '@/lib/supabase';
import { getSession, hasRole } from '@/lib/session';

export async function POST(req: Request) {
    if (!hasRole(getSession(req), ['admin'])) {
        return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { teamId, passType } = body; 

        if (!teamId || !passType) {
            return NextResponse.json({ error: 'Missing team ID or pass type' }, { status: 400 });
        }

        // Try searching by team_id first, then transaction_id
        let targetTeam = null;
        let { data: teamByTid } = await supabase
            .from('registrations')
            .select('transaction_id, team_id, meal_access')
            .eq('team_id', teamId.toUpperCase())
            .single();
            
        if (teamByTid) {
            targetTeam = teamByTid;
        } else {
            let { data: teamById } = await supabase
                .from('registrations')
                .select('transaction_id, team_id, meal_access')
                .eq('transaction_id', teamId)
                .single();
            if (teamById) {
                targetTeam = teamById;
            }
        }

        if (!targetTeam) {
             return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
        }

        const mealAccess = targetTeam.meal_access || { purchased_meals: [], networking_passes: [] };
        
        if (passType === 'meal' || passType === 'both') {
            mealAccess.purchased_meals = ['all'];
        }
        if (passType === 'networking' || passType === 'both') {
            mealAccess.networking_passes = ['all'];
        }

        const { error: updateError } = await supabase
            .from('registrations')
            .update({ meal_access: mealAccess })
            .eq('transaction_id', targetTeam.transaction_id);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, teamId: targetTeam.team_id });
    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Error.' }, { status: 503 });
    }
}
