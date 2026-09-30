import { NextResponse } from 'next/server';
import { teamSupabase as supabase } from '@/lib/supabase';
import { getSession, hasRole } from '@/lib/session';
import { getParticipantPortalMode } from '@/lib/event-windows';

export async function POST(req: Request) {
    const session = getSession(req);
    if (!hasRole(session, ['team']) || !session.teamId) {
        return NextResponse.json({ success: false, message: 'Team authentication required.' }, { status: 401 });
    }
    if (await getParticipantPortalMode() !== 'event') {
        return NextResponse.json({ success: false, message: 'Team dashboard access is available only October 10–11, 2026 (IST).' }, { status: 403 });
    }

    try {
        const { teamId, track, problemStatement } = await req.json();

        if (typeof teamId !== 'string' || teamId !== session.teamId || typeof track !== 'string' || !track.trim() || typeof problemStatement !== 'string' || !problemStatement.trim()) {
            return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
        }

        const { data: existing, error: lookupError } = await supabase
            .from('registrations')
            .select('raw_data')
            .eq('team_id', teamId)
            .maybeSingle();
        if (lookupError) throw lookupError;
        if (!existing) {
            return NextResponse.json({ success: false, message: 'Team not found.' }, { status: 404 });
        }

        const rawData = existing.raw_data && typeof existing.raw_data === 'object'
            ? { ...existing.raw_data }
            : {};
        if (rawData.ps_locked === true) {
            return NextResponse.json({ success: false, message: 'The track and problem statement are already locked.' }, { status: 409 });
        }
        rawData.ps_locked = true;

        const { error } = await supabase
            .from('registrations')
            .update({
                track: track,
                problem_statement: problemStatement,
                raw_data: rawData
            })
            .eq('team_id', session.teamId);

        if (error) {
            console.error("Failed to lock track:", error);
            return NextResponse.json({ success: false, message: "Database update failed", details: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: unknown) {
        console.error('Lock Track Error:', error);
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}
