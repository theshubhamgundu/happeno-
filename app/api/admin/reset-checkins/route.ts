import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
    try {
        const { type } = await req.json();

        if (type === 'gate') {
            const { error } = await supabase
                .from('registrations')
                .update({ is_checked_in: false, checked_in_at: null })
                .neq('team_id', 'invalid_placeholder'); // just a dummy condition to update all

            if (error) throw error;
        } else if (type === 'meals' || type === 'networking') {
            // Fetch all records
            const { data: teams, error: fetchErr } = await supabase
                .from('registrations')
                .select('id, raw_data, meal_access');

            if (fetchErr) throw fetchErr;

            for (const team of teams) {
                let updated = false;
                let newRawData = typeof team.raw_data === 'object' && team.raw_data !== null ? { ...team.raw_data } : {};

                if (type === 'meals') {
                    if (Array.isArray(newRawData.dinner_claimed)) {
                        newRawData.dinner_claimed = [];
                        updated = true;
                    }
                } else if (type === 'networking') {
                    if (Array.isArray(newRawData.networking_claimed)) {
                        newRawData.networking_claimed = [];
                        updated = true;
                    }
                }

                if (updated) {
                    await supabase
                        .from('registrations')
                        .update({ raw_data: newRawData })
                        .eq('id', team.id);
                }
            }
        } else {
            return NextResponse.json({ success: false, error: 'Invalid reset type' }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: `Successfully cleared all ${type} check-ins.` });
    } catch (error: any) {
        console.error('Reset Check-ins Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
