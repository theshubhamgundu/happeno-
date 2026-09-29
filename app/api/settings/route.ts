import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession, hasRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const session = getSession(req);
    if (!hasRole(session, ['admin', 'judge', 'volunteer', 'team', 'livescore'])) {
        return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    try {
        const { data, error } = await supabase
            .from('hackathon_settings')
            .select('key, value');

        if (error) throw error;

        let settings = Object.fromEntries((data || []).map(({ key, value }) => [key, value]));
        if (session.role === 'livescore') {
            const publicKeys = new Set(['start_date', 'released_rounds', 'round_configs', 'is_submission_locked']);
            settings = Object.fromEntries(Object.entries(settings).filter(([key]) => publicKeys.has(key)));
        } else if (session.role === 'team') {
            const teamKeys = new Set(['start_date', 'emergency_contact', 'wifi_details', 'released_rounds', 'round_configs', 'is_submission_locked', 'is_round_lock_enabled', 'enabled_meals']);
            settings = Object.fromEntries(Object.entries(settings).filter(([key]) => teamKeys.has(key)));
        }
        return NextResponse.json(settings, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        console.error('Settings fetch failed:', error);
        return NextResponse.json({ error: 'Could not fetch settings from Supabase.' }, { status: 503 });
    }
}

export async function POST(req: Request) {
    if (!hasRole(getSession(req), ['admin'])) {
        return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { key, value } = body;

        if (typeof key !== 'string' || !key.trim() || value === undefined) {
            return NextResponse.json({ error: 'A setting key and value are required.' }, { status: 400 });
        }

        const { error } = await supabase
            .from('hackathon_settings')
            .upsert({ key: key.trim(), value, updated_at: new Date().toISOString() });

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Settings update failed:', error);
        return NextResponse.json({ error: 'Could not save settings to Supabase.' }, { status: 503 });
    }
}
