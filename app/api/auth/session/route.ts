import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getParticipantPortalMode } from '@/lib/event-windows';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const session = getSession(req);
    if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });
    const portalMode = session.role === 'team'
        ? (session.portalMode || await getParticipantPortalMode())
        : undefined;
    return NextResponse.json({
        authenticated: true,
        role: session.role,
        id: session.id,
        teamId: session.teamId,
        name: session.name,
        portalMode
    }, { headers: { 'Cache-Control': 'no-store' } });
}
