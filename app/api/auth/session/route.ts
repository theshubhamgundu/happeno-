import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const session = getSession(req);
    if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });
    return NextResponse.json({
        authenticated: true,
        role: session.role,
        id: session.id,
        teamId: session.teamId,
        name: session.name
    }, { headers: { 'Cache-Control': 'no-store' } });
}
