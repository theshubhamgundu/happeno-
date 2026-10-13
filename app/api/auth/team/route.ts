import { NextResponse } from 'next/server';
import { teamSupabase as supabase } from '@/lib/supabase';
import { setSessionCookie } from '@/lib/session';
import { verifyPassword } from '@/lib/COST_FACTOR';
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
        const normalizedTeamId = teamId.trim().toUpperCase();

        const portalMode = await getParticipantPortalMode();

        if (portalMode === 'closed') {
            return NextResponse.json({ success: false, error: 'The Tri-City Hackathon has concluded. Participant portal and logins are permanently closed.' }, { status: 403 });
        }

        const { data: databaseTeam, error: databaseError } = await supabase
            .from('registrations')
            .select('team_id, team_name, password_hash, credentials_issued_at, status, raw_data, captain, members')
            .eq('team_id', normalizedTeamId)
            .maybeSingle();

        if (databaseError) {
            console.error('Database team authentication failed:', databaseError);
            return NextResponse.json({ success: false, error: 'Could not verify team credentials.' }, { status: 503 });
        }
        if (!databaseTeam) {
            return NextResponse.json({ success: false, error: 'Invalid Participant ID or Password' }, { status: 401 });
        }
        // --- Dual-password check ---
        // 1) Fast logical password: @FirstNameTEAMID (instant, no hashing)
        //    Handles initials like "G.Tejasree" → skips "G." and uses "Tejasree"
        //    Case-insensitive comparison
        const raw_check = (databaseTeam.raw_data && typeof databaseTeam.raw_data === 'object') ? (databaseTeam.raw_data as any) : {};
        const rawCaptain = raw_check.captain || raw_check.participants?.[0] || {};
        // Try: raw_data.captain.fullName → top-level captain column → members[0].fullName
        const captainFullName: string = rawCaptain.fullName || rawCaptain.name || rawCaptain.full_name 
            || (typeof databaseTeam.captain === 'string' ? databaseTeam.captain : '')
            || (Array.isArray(databaseTeam.members) && databaseTeam.members[0]?.fullName) || '';
        
        // Split name into parts, strip dots/special chars, find the first "real" name (length > 1)
        const nameParts = captainFullName.split(/[\s.]+/).map((p: string) => p.replace(/[^a-zA-Z]/g, '')).filter(Boolean);
        const firstName = nameParts.find((p: string) => p.length > 1) || nameParts[0] || '';
        const logicalPassword = firstName ? `@${firstName}${normalizedTeamId.replace(/[^0-9]/g, '')}` : '';

        let passwordValid = false;

        // Try the logical password first (instant, zero CPU cost, case-insensitive)
        if (logicalPassword && password.toLowerCase() === logicalPassword.toLowerCase()) {
            passwordValid = true;
        }
        // Fall back to system-generated bcrypt hash
        else if (databaseTeam.password_hash && databaseTeam.credentials_issued_at) {
            passwordValid = await verifyPassword(password, databaseTeam.password_hash);
        }

        if (!passwordValid) {
            return NextResponse.json({ success: false, error: 'Invalid Participant ID or Password' }, { status: 401 });
        }

        let activeTeam = databaseTeam;
        const raw = (databaseTeam.raw_data && typeof databaseTeam.raw_data === 'object') ? (databaseTeam.raw_data as any) : {};
        const targetId = raw.merged_into_team_id;
        const comboQuery = supabase
            .from('registrations')
            .select('team_id, team_name, password_hash, credentials_issued_at, status, raw_data, captain, members');
        const { data: comboTeam } = targetId
            ? await comboQuery.eq('team_id', String(targetId).trim().toUpperCase()).maybeSingle()
            : await comboQuery
                .eq('status', 'COMPLETED')
                .contains('raw_data', { merged_from_teams: [normalizedTeamId] })
                .maybeSingle();
        if (comboTeam) {
            activeTeam = comboTeam;
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
