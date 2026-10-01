import { NextResponse } from 'next/server';
import { getSession, hasRole } from '@/lib/session';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const session = getSession(req);
    if (!hasRole(session, ['volunteer', 'admin']) || !session.id) {
        return NextResponse.json({ success: false, error: 'Volunteer or Admin authentication required.' }, { status: 401 });
    }

    try {
        const body = await req.json() as { teamId?: unknown; passType?: unknown; memberId?: unknown };
        const teamId = typeof body.teamId === 'string' ? body.teamId.trim().toUpperCase() : '';
        const passType = body.passType === 'leader' || body.passType === 'member' ? body.passType : body.passType === 'legacy' ? 'legacy' : '';
        const memberId = typeof body.memberId === 'string' ? body.memberId.trim() : '';
        if (!teamId || !passType || (passType === 'member' && !memberId)) {
            return NextResponse.json({ success: false, error: 'Pass data is invalid.' }, { status: 400 });
        }

        const { data, error } = await supabase.rpc('scan_volunteer_pass', {
            p_team_id: teamId,
            p_pass_type: passType,
            p_member_id: memberId,
            p_volunteer_id: session.id
        });
        if (error) {
            console.error('Volunteer scan RPC failed:', error);
            return NextResponse.json({
                success: false,
                error: error.code === 'PGRST202' || error.code === '42883'
                    ? 'Volunteer scan database migration is not installed yet.'
                    : 'Could not save this scan. Please retry.'
            }, { status: 503 });
        }

        const result = data && typeof data === 'object' ? data as Record<string, unknown> : {};
        if (result.status === 'TEAM_NOT_FOUND' || result.status === 'INVALID_PASS' || result.status === 'MEMBER_NOT_FOUND') {
            return NextResponse.json({ success: false, result }, { status: 404 });
        }
        return NextResponse.json({ success: true, result }, { headers: { 'Cache-Control': 'no-store, private' } });
    } catch (error) {
        console.error('Volunteer scan failed:', error);
        return NextResponse.json({ success: false, error: 'Could not process scan. Please retry.' }, { status: 500 });
    }
}