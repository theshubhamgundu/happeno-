import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession, hasRole } from '@/lib/session';
import { hashPassword } from '@/lib/password';
import { randomBytes } from 'node:crypto';

const publicFields = 'id, generated_id, name, specialization, created_at';

export async function GET(req: Request) {
    if (!hasRole(getSession(req), ['admin', 'judge', 'livescore'])) {
        return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    try {
        const { data, error } = await supabase
            .from('judges')
            .select(publicFields)
            .order('name');
        if (error) throw error;
        return NextResponse.json(data || [], { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        console.error('Judges fetch failed:', error);
        return NextResponse.json({ error: 'Could not fetch judges from Supabase.' }, { status: 503 });
    }
}

export async function POST(req: Request) {
    if (!hasRole(getSession(req), ['admin'])) {
        return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });
    }

    try {
        const { name, specialization, phone } = await req.json();
        if (typeof name !== 'string' || !name.trim()) {
            return NextResponse.json({ error: 'Judge name is required.' }, { status: 400 });
        }

        const { data: generatedId, error: idError } = await supabase.rpc('next_staff_id', { staff_type: 'judge' });
        if (idError || typeof generatedId !== 'string') throw idError || new Error('Could not allocate a judge ID.');
        
        let password = randomBytes(18).toString('base64url');
        if (phone && typeof phone === 'string') {
            const digits = phone.replace(/\D/g, '').slice(-10);
            if (digits.length === 10) password = digits;
        }

        const { data, error } = await supabase
            .from('judges')
            .insert({ name: name.trim(), specialization, generated_id: generatedId, password_hash: await hashPassword(password) })
            .select(publicFields)
            .single();
        if (error) throw error;
        return NextResponse.json({ success: true, data: { ...data, password } });
    } catch (error) {
        console.error('Judge save failed:', error);
        return NextResponse.json({ error: 'Could not save judge to Supabase.' }, { status: 503 });
    }
}

export async function DELETE(req: Request) {
    if (!hasRole(getSession(req), ['admin'])) {
        return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });
    }

    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required.' }, { status: 400 });

    try {
        const { data, error } = await supabase.from('judges').delete().eq('generated_id', id).select('id');
        if (error) throw error;
        if (!data?.length) {
            const { error: idError } = await supabase.from('judges').delete().eq('id', id);
            if (idError) throw idError;
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Judge deletion failed:', error);
        return NextResponse.json({ error: 'Could not delete judge from Supabase.' }, { status: 503 });
    }
}
