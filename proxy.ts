import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : null;

// Global rate limit: 60 requests per 1 minute per IP
const globalRateLimit = redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'),
    analytics: true,
}) : null;

// ─── Web Crypto API for Edge Runtime ──────────────────────────────────────────
async function verifySignatureEdge(payload: string, signatureBase64url: string, secret: string) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
    );

    const signatureBase64 = signatureBase64url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = signatureBase64.length % 4;
    const padded = pad ? signatureBase64 + '='.repeat(4 - pad) : signatureBase64;

    const signatureStr = atob(padded);
    const signatureBytes = new Uint8Array(signatureStr.length);
    for (let i = 0; i < signatureStr.length; i++) {
        signatureBytes[i] = signatureStr.charCodeAt(i);
    }

    return await crypto.subtle.verify(
        'HMAC',
        key,
        signatureBytes,
        encoder.encode(payload)
    );
}

export async function proxy(request: NextRequest) {
    // 1. Global API Rate Limiting
    if (request.nextUrl.pathname.startsWith('/api')) {
        if (globalRateLimit) {
            const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
            const { success } = await globalRateLimit.limit(`global_api_${ip}`);

            if (!success) {
                return new NextResponse(
                    JSON.stringify({ error: 'Too many requests. Please slow down.' }),
                    { status: 429, headers: { 'Content-Type': 'application/json' } }
                );
            }
        }
    }

    // 2. Admin Dashboard Protection
    if (request.nextUrl.pathname.startsWith('/dashboard/admin')) {
        const cookie = request.cookies.get('Happeno_session');

        if (!cookie) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        try {
            const token = decodeURIComponent(cookie.value);
            const [payload, signature, extra] = token.split('.');

            if (!payload || !signature || extra) {
                return NextResponse.redirect(new URL('/login', request.url));
            }

            const secret = process.env.AUTH_SESSION_SECRET;
            if (!secret) {
                return NextResponse.redirect(new URL('/login', request.url));
            }

            const isValid = await verifySignatureEdge(payload, signature, secret);

            if (!isValid) {
                return NextResponse.redirect(new URL('/login', request.url));
            }

            const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
            const session = JSON.parse(decodedPayload);

            if (session.expiresAt <= Date.now() || session.role !== 'admin') {
                return NextResponse.redirect(new URL('/login', request.url));
            }

            return NextResponse.next();
        } catch (error) {
            console.error('Middleware session verification failed:', error);
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/dashboard/admin/:path*',
        '/api/:path*'
    ],
};
