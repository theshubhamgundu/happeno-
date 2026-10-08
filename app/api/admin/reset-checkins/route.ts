import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);
import { redis } from '@/lib/redis';

export async function POST(req: Request) {
    try {
        const { type } = await req.json();

        if (type === 'gate' || type === 'meals' || type === 'networking') {
            // Fetch all records
            const { data: teams, error: fetchErr } = await supabase
                .from('registrations')
                .select('transaction_id, team_id, is_checked_in, raw_data, meal_access');

            if (fetchErr) throw fetchErr;

            for (const team of teams) {
                let updated = false;
                let newRawData = typeof team.raw_data === 'object' && team.raw_data !== null ? { ...team.raw_data } : {};
                let newMealAccess = typeof team.meal_access === 'object' && team.meal_access !== null ? { ...team.meal_access } : {};
                let newIsCheckedIn = team.is_checked_in;

                if (type === 'gate') {
                    if (newIsCheckedIn || 'checkedInAt' in newRawData || 'isCheckedIn' in newRawData) {
                        newIsCheckedIn = false;
                        delete newRawData.checkedInAt;
                        delete newRawData.isCheckedIn;
                        updated = true;
                    }
                } else if (type === 'meals') {
                    if (Array.isArray(newMealAccess.dinner_claimed) && newMealAccess.dinner_claimed.length > 0) {
                        newMealAccess.dinner_claimed = [];
                        updated = true;
                    }
                } else if (type === 'networking') {
                    if (Array.isArray(newMealAccess.networking_claimed) && newMealAccess.networking_claimed.length > 0) {
                        newMealAccess.networking_claimed = [];
                        updated = true;
                    }
                }

                if (updated) {
                    await supabase
                        .from('registrations')
                        .update({ is_checked_in: newIsCheckedIn, raw_data: newRawData, meal_access: newMealAccess })
                        .eq('transaction_id', team.transaction_id);
                }
            }
        } else {
            return NextResponse.json({ success: false, error: 'Invalid reset type' }, { status: 400 });
        }

        // Invalidate Redis cache so the dashboard immediately sees the empty check-ins
        if (redis) {
            await redis.del('all_teams_cache_admin');
            await redis.del('all_teams_cache_livescore');
        }

        return NextResponse.json({ success: true, message: `Successfully cleared all ${type} check-ins.` });
    } catch (error: any) {
        console.error('Reset Check-ins Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
