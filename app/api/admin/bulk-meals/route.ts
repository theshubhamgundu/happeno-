import { NextResponse } from 'next/server';
import { teamSupabase as supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';
import { EVENT_MEALS, getDefaultMealAccess } from '@/lib/meals';

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

        // --- Local mode (no Supabase) ---
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            const dataPath = path.join(process.cwd(), 'data', 'registrations.json');
            if (!fs.existsSync(dataPath)) {
                return NextResponse.json({ error: 'No local data file found' }, { status: 404 });
            }

            const localData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            let updated = 0;

            const patched = localData.map((t: any) => {
                // Only set if mealAccess is absent or empty
                if (!t.mealAccess || Object.keys(t.mealAccess).length === 0) {
                    t.mealAccess = mealAccess;
                    updated++;
                }
                return t;
            });

            fs.writeFileSync(dataPath, JSON.stringify(patched, null, 2), 'utf8');
            return NextResponse.json({ updated, total: localData.length });
        }

        // --- Supabase mode ---
        const { data: teams, error: fetchError } = await supabase
            .from('projects')
            .select('id, meal_access');

        if (fetchError) throw fetchError;

        let updated = 0;
        for (const team of (teams || [])) {
            if (!team.meal_access || Object.keys(team.meal_access).length === 0) {
                const { error } = await supabase
                    .from('projects')
                    .update({ meal_access: mealAccess })
                    .eq('id', team.id);
                if (error) throw error;
                updated++;
            }
        }

        return NextResponse.json({ updated, total: (teams || []).length });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
