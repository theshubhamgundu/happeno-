import { NextResponse } from 'next/server';
import { teamSupabase as supabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const { teamId, track, problemStatement } = await req.json();

        if (!teamId || !track || !problemStatement) {
            return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
        }

        // Fetch existing raw_data to merge the lock flag
        const { data: existing } = await supabase
            .from('registrations')
            .select('raw_data')
            .eq('team_id', teamId)
            .single();

        const rawData = existing?.raw_data || {};
        rawData.ps_locked = true; // Lock the problem statement so it can't be changed

        const { error } = await supabase
            .from('registrations')
            .update({
                track: track,
                problem_statement: problemStatement,
                raw_data: rawData
            })
            .eq('team_id', teamId);

        if (error) {
            console.error("Failed to lock track:", error);
            return NextResponse.json({ success: false, message: "Database update failed", details: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Lock Track Error:', error);
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}
