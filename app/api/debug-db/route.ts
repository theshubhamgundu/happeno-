import { NextResponse } from 'next/server';
import { supabase, teamSupabase } from '@/lib/supabase';

export async function GET() {
    try {
        const { count: mainCount, error: mainError } = await supabase.from('registrations').select('*', { count: 'exact', head: true });
        const { count: teamCount, error: teamError } = await teamSupabase.from('registrations').select('*', { count: 'exact', head: true });

        return NextResponse.json({
            success: true,
            mainProject: {
                hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
                count: mainCount,
                error: mainError ? { message: mainError.message, code: mainError.code } : null
            },
            teamProject: {
                hasUrl: !!process.env.NEXT_PUBLIC_TEAM_SUPABASE_URL,
                count: teamCount,
                error: teamError ? { message: teamError.message, code: teamError.code } : null
            }
        });
    } catch (err: any) {
        return NextResponse.json({
            success: false,
            message: "Exception occurred",
            error: String(err)
        }, { status: 500 });
    }
}
