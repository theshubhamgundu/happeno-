import { NextResponse } from 'next/server';
import { teamSupabase as supabase } from '@/lib/supabase';
import { setSessionCookie } from '@/lib/session';
import { verifyPassword } from '@/lib/password';
import { getParticipantPortalMode } from '@/lib/event-windows';
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/redis';

export async function POST(req: Request) {
    if (!process.env.AUTH_SESSION_SECRET || Buffer.byteLength(process.env.AUTH_SESSION_SECRET) < 32) {
        return NextResponse.json({ success: false, error: 'Authentication is not configured. Set AUTH_SESSION_SECRET to at least 32 random bytes.' }, { status: 503 });
    }

    try {
        // --- Rate Limiting ---
        if (redis) {
            const ratelimit = new Ratelimit({
                redis,
                limiter: Ratelimit.slidingWindow(5, '1 m'),
                analytics: true,
            });
            const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
            const { success } = await ratelimit.limit(`ratelimit_login_${ip}`);
            if (!success) {
                return NextResponse.json({ success: false, error: 'Too many login attempts. Please try again in a minute.' }, { status: 429 });
            }
        }
        // ---------------------
        const { teamId, password } = await req.json();
        if (typeof teamId !== 'string' || typeof password !== 'string') {
            return NextResponse.json({ success: false, error: 'Team ID and password are required.' }, { status: 400 });
        }
        const portalMode = await getParticipantPortalMode();
        if (portalMode === 'closed') {
            return NextResponse.json({ success: false, error: 'The participant portal is currently closed.' }, { status: 403 });
        }
        const normalizedTeamId = teamId.trim().toUpperCase();

        const { data: databaseTeam, error: databaseError } = await supabase
            .from('registrations')
            .select('team_id, team_name, password_hash, credentials_issued_at, status, merged_into, raw_data')
            .eq('team_id', normalizedTeamId)
            .maybeSingle();

        if (databaseError) {
            console.error('Database team authentication failed:', databaseError);
            return NextResponse.json({ success: false, error: 'Could not verify team credentials.' }, { status: 503 });
        }
        if (!databaseTeam?.password_hash || !databaseTeam.credentials_issued_at || !(await verifyPassword(password, databaseTeam.password_hash))) {
            return NextResponse.json({ success: false, error: 'Invalid Participant ID or Password' }, { status: 401 });
        }

        let activeTeam = databaseTeam;
        if (String(databaseTeam.status).toUpperCase() === 'MERGED') {
            const raw = (databaseTeam.raw_data && typeof databaseTeam.raw_data === 'object') ? (databaseTeam.raw_data as any) : {};
            const targetId = databaseTeam.merged_into || raw.merged_into_team_id;
            if (targetId) {
                const { data: comboTeam } = await supabase
                    .from('registrations')
                    .select('team_id, team_name, password_hash, credentials_issued_at, status')
                    .eq('team_id', String(targetId).trim().toUpperCase())
                    .maybeSingle();
                if (comboTeam) {
                    activeTeam = comboTeam;
                }
            }
        }

        if (['PENDING', 'REJECTED'].includes(String(activeTeam.status).toUpperCase())) {
            return NextResponse.json({ success: false, error: 'Your registration is awaiting approval.' }, { status: 403 });
        }

        return setSessionCookie(
            NextResponse.json({
                success: true,
                teamId: activeTeam.team_id,
                teamName: activeTeam.team_name,
                portalMode
            }),
            { role: 'team', id: activeTeam.team_id, teamId: activeTeam.team_id, name: activeTeam.team_name, portalMode }
        );
    } catch (error) {
        console.error('Team authentication failed:', error);
        return NextResponse.json({ success: false, error: 'Could not verify team credentials with Supabase.' }, { status: 503 });
    }
}