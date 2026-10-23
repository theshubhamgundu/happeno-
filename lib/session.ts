import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { NextResponse } from 'next/server';
import type { ParticipantPortalMode } from '@/lib/event-windows';

export type SessionRole = 'team' | 'judge' | 'volunteer' | 'admin' | 'livescore';

export interface AppSession {
    role: SessionRole;
    id?: string;
    teamId?: string;
    name?: string;
    portalMode?: ParticipantPortalMode;
    expiresAt: number;
}

const COOKIE_NAME = 'happeno_session';
const SESSION_SECONDS = 60 * 60 * 12;

function getSecret(): string {
    const secret = process.env.AUTH_SESSION_SECRET;
    if (!secret || Buffer.byteLength(secret) < 32) {
        throw new Error('AUTH_SESSION_SECRET must contain at least 32 bytes of random data.');
    }
    return secret;
}

function sign(payload: string): string {
    return createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

export function setSessionCookie(response: NextResponse, session: Omit<AppSession, 'expiresAt'>): NextResponse {
    const payload = Buffer.from(JSON.stringify({
        ...session,
        expiresAt: Date.now() + SESSION_SECONDS * 1000
    })).toString('base64url');
    response.cookies.set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_SECONDS
    });
    return response;
}

export function clearSessionCookie(response: NextResponse): NextResponse {
    response.cookies.set(COOKIE_NAME, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0
    });
    return response;
}

export function getSession(request: Request): AppSession | null {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookie = cookieHeader.split(';').map(value => value.trim()).find(value => value.startsWith(`${COOKIE_NAME}=`));
    if (!cookie) return null;

    try {
        const token = decodeURIComponent(cookie.slice(COOKIE_NAME.length + 1));
        const [payload, signature, extra] = token.split('.');
        if (!payload || !signature || extra) return null;

        const expected = Buffer.from(sign(payload));
        const actual = Buffer.from(signature);
        if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

        const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as AppSession;
        if (session.expiresAt <= Date.now()) return null;
        if (!['team', 'judge', 'volunteer', 'admin', 'livescore'].includes(session.role)) return null;
        return session;
    } catch {
        return null;
    }
}

export function hasRole(session: AppSession | null, roles: SessionRole[]): session is AppSession {
    return Boolean(session && roles.includes(session.role));
}
