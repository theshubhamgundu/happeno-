import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { setSessionCookie } from '@/lib/session';
import { verifyPassword } from '@/lib/password';

function matchesCredential(input: string, stored: string): boolean {
    const inputBytes = Buffer.from(input);
    const storedBytes = Buffer.from(stored);
    return inputBytes.length === storedBytes.length && timingSafeEqual(inputBytes, storedBytes);
}

export async function POST(req: Request) {
    try {
        const { role, id, password } = await req.json();
        if (!['admin', 'judge', 'volunteer'].includes(role) || typeof id !== 'string' || typeof password !== 'string') {
            return NextResponse.json({ success: false, error: 'Invalid credentials.' }, { status: 400 });
        }

        if (role === 'admin') {
            const adminId = process.env.ADMIN_LOGIN_ID;
            const adminPassword = process.env.ADMIN_PASSWORD;
            if (!adminId || !adminPassword) {
                return NextResponse.json({ success: false, error: 'Admin login is not configured.' }, { status: 503 });
            }
            if (matchesCredential(id.toLowerCase(), adminId.toLowerCase()) && matchesCredential(password, adminPassword)) {
                return setSessionCookie(
                    NextResponse.json({ success: true, id: adminId, name: 'Administrator' }),
                    { role: 'admin', id: adminId, name: 'Administrator' }
                );
            }
            return NextResponse.json({ success: false, error: 'Invalid Admin credentials.' }, { status: 401 });
        }

        const table = role === 'judge' ? 'judges' : 'volunteers';
        const { data, error } = await supabase
            .from(table)
            .select('generated_id, name, password_hash')
            .ilike('generated_id', id.trim())
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
