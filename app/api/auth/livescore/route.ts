import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { setSessionCookie } from '@/lib/session';

export async function POST(req: Request) {
    if (!process.env.AUTH_SESSION_SECRET || Buffer.byteLength(process.env.AUTH_SESSION_SECRET) < 32) {
        return NextResponse.json({ success: false, error: 'Authentication is not configured. Set AUTH_SESSION_SECRET to at least 32 random bytes.' }, { status: 503 });
    }

    try {
        const { password } = await req.json();
        const configuredPassword = process.env.LIVESCORE_PASSWORD;
        if (!configuredPassword) {
            return NextResponse.json({ success: false, error: 'Live-score access is not configured.' }, { status: 503 });
        }
        if (typeof password !== 'string') {
            return NextResponse.json({ success: false, error: 'Password is required.' }, { status: 400 });
        }

        const supplied = Buffer.from(password);
        const expected = Buffer.from(configuredPassword);
        if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
            return NextResponse.json({ success: false, error: 'Access denied.' }, { status: 401 });
        }

        return setSessionCookie(
            NextResponse.json({ success: true }),
            { role: 'livescore' }
        );
    } catch (error) {
        console.error('Live-score authentication failed:', error);
        return NextResponse.json({ success: false, error: 'Could not verify access.' }, { status: 503 });
    }
}
