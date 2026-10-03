import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { setSessionCookie } from '@/lib/session';
import { verifyPassword } from '@/lib/password';
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/redis';

function matchesCredential(input: string, stored: string): boolean {
    const inputBytes = Buffer.from(input);
    const storedBytes = Buffer.from(stored);
    return inputBytes.length === storedBytes.length && timingSafeEqual(inputBytes, storedBytes);
}

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
        const { role, id, password } = await req.json();
        if (!['admin', 'judge', 'volunteer'].includes(role) || typeof id !== 'string' || typeof password !== 'string') {
            return NextResponse.json({ success: false, error: 'Invalid credentials.' }, { status: 400 });
        }

        if (role === 'admin') {
            const { data, error } = await supabase
                .from('admins')
                .select('id, username, name, password_hash, authorized_device_id')
                .eq('username', id.toLowerCase().trim())
                .maybeSingle();

            if (error) throw error;
            if (!data?.password_hash || !(await verifyPassword(password, data.password_hash))) {
                return NextResponse.json({ success: false, error: 'Invalid Admin credentials.' }, { status: 401 });
            }

            // DEVICE LOCKING LOGIC
            const cookies = req.headers.get('cookie') || '';
            const deviceTokenCookie = cookies.split('; ').find(row => row.startsWith('admin_device_token='))?.split('=')[1];
            
            if (data.authorized_device_id && data.authorized_device_id !== deviceTokenCookie) {
                return NextResponse.json({ success: false, error: 'Login rejected: This device is not authorized for this admin account.' }, { status: 403 });
            }

            let response = NextResponse.json({ success: true, id: data.id, name: data.name });
            
            // First time login on their laptop: bind this device to the admin!
            if (!data.authorized_device_id) {
                const newDeviceToken = crypto.randomUUID();
                await supabase.from('admins').update({ authorized_device_id: newDeviceToken }).eq('id', data.id);
                response.headers.append('Set-Cookie', `admin_device_token=${newDeviceToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=315360000;`);
            }

            return setSessionCookie(
                response,
                { role: 'admin', id: data.id, name: data.name }
            );
        }

        const table = role === 'judge' ? 'judges' : 'volunteers';
        const { data, error } = await supabase
            .from(table)
            .select('generated_id, name, password_hash')
            .eq('generated_id', id.trim().toUpperCase())
            .maybeSingle();
        if (error) throw error;

        if (!data?.password_hash || !(await verifyPassword(password, data.password_hash))) {
            return NextResponse.json({ success: false, error: `Invalid ${role} ID or password.` }, { status: 401 });
        }

        return setSessionCookie(
            NextResponse.json({ success: true, id: data.generated_id, name: data.name }),
            { role, id: data.generated_id, name: data.name }
        );
    } catch (error) {
        console.error('Staff authentication failed:', error);
        return NextResponse.json({ success: false, error: 'Could not verify credentials with Supabase.' }, { status: 503 });
    }
}
