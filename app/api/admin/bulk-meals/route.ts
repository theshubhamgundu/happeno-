import { NextResponse } from 'next/server';
import { teamSupabase as supabase } from '@/lib/supabase';
import { EVENT_MEALS, getDefaultMealAccess } from '@/lib/meals';
import { getSession, hasRole } from '@/lib/session';

/**
 * POST /api/admin/bulk-meals
 * Assigns a meal plan to every team in the database that doesn't already
 * have one (idempotent). Intended for admin one-click setup.
 *
 * Body (optional):
 *   { mealKeys?: string[] }   — if provided, only those meals are set to included: true
 *                                otherwise all meals are set to included: true.
 */
export async function POST(req: Request) {
    if (!hasRole(getSession(req), ['admin'])) {
        return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });
    }

    try {
        const body = await req.json().catch(() => ({}));
        const mealKeys: string[] = body.mealKeys ?? EVENT_MEALS.map(m => m.key);

        // Build the meal access map
        const mealAccess = getDefaultMealAccess();
        mealKeys.forEach(key => {
            if (mealAccess[key]) {
                mealAccess[key].included = true;
            }
        });

        const { data: teams, error: fetchError } = await supabase
            .from('registrations')
            .select('transaction_id, meal_access')
            .neq('status', 'MERGED');

        if (fetchError) throw fetchError;

        let updated = 0;
        for (const team of (teams || [])) {
            if (!team.meal_access || Object.keys(team.meal_access).length === 0) {
                const { error } = await supabase
                    .from('registrations')
                    .update({ meal_access: mealAccess })
                    .eq('transaction_id', team.transaction_id);
                if (error) throw error;
                updated++;
            }
        }

        return NextResponse.json({ updated, total: (teams || []).length });
    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not update meal access.' }, { status: 503 });
    }
}
