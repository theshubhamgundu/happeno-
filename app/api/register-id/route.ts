import { NextResponse } from 'next/server';
import { teamSupabase as supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    if (process.env.PUBLIC_REGISTRATIONS_OPEN !== 'true') {
        return NextResponse.json({ success: false, error: 'Registrations are closed.' }, { status: 403 });
    }

    try {
        const { data: nextId, error } = await supabase.rpc('next_registration_team_id');
        if (error) throw error;

        return NextResponse.json({ success: true, nextId });
    } catch (error: any) {
        console.error('Register-ID route failed:', error);
        return NextResponse.json({
            success: false,
            error: 'Could not reserve a team ID in Supabase.'
        }, { status: 503 });
    }
}
