import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { setSessionCookie, getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const targetRole = String(body.role || '').toLowerCase().trim();
        const requestedTeamId = body.teamId ? String(body.teamId).trim().toUpperCase() : null;

        // Security check: Only allow if authenticated as admin OR in development mode
        const existingSession = getSession(req);
        const isDevelopment = process.env.NODE_ENV !== 'production';
        const isAdmin = existingSession?.role === 'admin';

        if (!isDevelopment && !isAdmin) {
            return NextResponse.json({ 
                success: false, 
                error: 'Unauthorized: Multi-role testing switcher is restricted to administrators.' 
            }, { status: 403 });
        }

        if (!['team', 'judge', 'volunteer', 'admin'].includes(targetRole)) {
            return NextResponse.json({ success: false, error: 'Invalid target role.' }, { status: 400 });
        }

        // 1. SWITCH TO PARTICIPANT (TEAM)
        if (targetRole === 'team') {
            let teamData = null;

            if (requestedTeamId) {
                const { data } = await supabase
                    .from('registrations')
                    .select('team_id, team_name, status')
                    .eq('team_id', requestedTeamId)
                    .maybeSingle();
                teamData = data;
            }

            if (!teamData) {
                // Pick the first approved/completed team in DB
                const { data } = await supabase
                    .from('registrations')
                    .select('team_id, team_name, status')
                    .neq('status', 'MERGED')
                    .limit(10);
                if (data && data.length > 0) {
                    teamData = data.find(t => t.team_id) || data[0];
                }
            }

            const teamId = teamData?.team_id || 'TRI26002';
            const teamName = teamData?.team_name || 'Individual';

            const response = NextResponse.json({
                success: true,
                role: 'team',
                teamId,
                teamName,
                portalMode: 'event',
                destination: '/dashboard/team',
                message: `Switched session to Participant (${teamId}: ${teamName})`
            });

            return setSessionCookie(response, {
                role: 'team',
                id: teamId,
                teamId,
                name: teamName,
                portalMode: 'event' // Always ensure 'event' mode so test user lands directly on full participant dashboard
            });
        }

        // 2. SWITCH TO EVALUATOR (JUDGE)
        if (targetRole === 'judge') {
            const { data: evaluatorData } = await supabase
                .from('judges')
                .select('id, generated_id, name, specialization')
                .order('created_at', { ascending: true })
                .limit(1)
                .maybeSingle();

            const evaluatorId = evaluatorData?.generated_id || 'TC-J-101';
            const evaluatorName = evaluatorData?.name || 'Dr. Evaluator Panel';

            const response = NextResponse.json({
                success: true,
                role: 'judge',
                id: evaluatorId,
                name: evaluatorName,
                destination: '/dashboard/judge',
                message: `Switched session to Evaluator (${evaluatorId}: ${evaluatorName})`
            });

            return setSessionCookie(response, {
                role: 'judge',
                id: evaluatorId,
                name: evaluatorName
            });
        }

        // 3. SWITCH TO VOLUNTEER
        if (targetRole === 'volunteer') {
            const { data: volunteerData } = await supabase
                .from('volunteers')
                .select('id, generated_id, name, role')
                .order('created_at', { ascending: true })
                .limit(1)
                .maybeSingle();

            const volunteerId = volunteerData?.generated_id || 'TC-V-101';
            const volunteerName = volunteerData?.name || 'Station Volunteer Lead';

            const response = NextResponse.json({
                success: true,
                role: 'volunteer',
                id: volunteerId,
                name: volunteerName,
                destination: '/dashboard/volunteer',
                message: `Switched session to Volunteer (${volunteerId}: ${volunteerName})`
            });

            return setSessionCookie(response, {
                role: 'volunteer',
                id: volunteerId,
                name: volunteerName
            });
        }

        // 4. SWITCH TO ADMIN
        if (targetRole === 'admin') {
            const adminId = process.env.ADMIN_LOGIN_ID || 'admin@tri';
            const response = NextResponse.json({
                success: true,
                role: 'admin',
                id: adminId,
                name: 'Administrator',
                destination: '/dashboard/admin',
                message: 'Switched session to Administrator'
            });

            return setSessionCookie(response, {
                role: 'admin',
                id: adminId,
                name: 'Administrator'
            });
        }

        return NextResponse.json({ success: false, error: 'Unhandled role.' }, { status: 400 });
    } catch (err: unknown) {
        console.error('Test role switch failed:', err);
        return NextResponse.json({ 
            success: false, 
            error: err instanceof Error ? err.message : 'Role switch failed.' 
        }, { status: 500 });
    }
}
