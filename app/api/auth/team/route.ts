import { NextResponse } from 'next/server';
import { teamSupabase as supabase } from '@/lib/supabase';
import { setSessionCookie } from '@/lib/session';
import { verifyPassword } from '@/lib/password';

export async function POST(req: Request) {
    if (!process.env.AUTH_SESSION_SECRET || Buffer.byteLength(process.env.AUTH_SESSION_SECRET) < 32) {
        return NextResponse.json({ success: false, error: 'Authentication is not configured. Set AUTH_SESSION_SECRET to at least 32 random bytes.' }, { status: 503 });
    }

    try {
        const { teamId, password } = await req.json();
        if (typeof teamId !== 'string' || typeof password !== 'string') {
            return NextResponse.json({ success: false, error: 'Team ID and password are required.' }, { status: 400 });
        }
        const normalizedTeamId = teamId.trim().toUpperCase();

        const { data: databaseTeam, error: databaseError } = await supabase
            .from('registrations')
            .select('team_id, team_name, password_hash, status')
            .eq('team_id', normalizedTeamId)
            .maybeSingle();

        if (databaseError) {
            console.error('Database team authentication failed:', databaseError);
            return NextResponse.json({ success: false, error: 'Could not verify team credentials.' }, { status: 503 });
        }
        if (!databaseTeam?.password_hash || !(await verifyPassword(password, databaseTeam.password_hash))) {
            return NextResponse.json({ success: false, error: 'Invalid Participant ID or Password' }, { status: 401 });
        }
        if (['PENDING', 'REJECTED', 'MERGED'].includes(String(databaseTeam.status).toUpperCase())) {
            return NextResponse.json({ success: false, error: 'Your registration is awaiting approval.' }, { status: 403 });
        }

        return setSessionCookie(
            NextResponse.json({
                success: true,
                teamId: databaseTeam.team_id,
                teamName: databaseTeam.team_name
            }),
            { role: 'team', id: databaseTeam.team_id, teamId: databaseTeam.team_id, name: databaseTeam.team_name }
        );
    } catch (error) {
        console.error('Team authentication failed:', error);
        return NextResponse.json({ success: false, error: 'Could not verify team credentials with Supabase.' }, { status: 503 });
    }
}