import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession, hasRole } from '@/lib/session';
import { normalizeJudgingRounds } from '@/lib/judging-rounds';

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

        if (key.trim() === 'round_configs') {
            if (!Array.isArray(value)) {
                return NextResponse.json({ error: 'Judging rounds must be an array.' }, { status: 400 });
            }
            const nextRounds = normalizeJudgingRounds(value);
            if (nextRounds.length !== value.length || !nextRounds.length) {
                return NextResponse.json({ error: 'Every round needs a unique ID and at least one valid criterion.' }, { status: 400 });
            }

            const { data: previousSetting, error: previousError } = await supabase
                .from('hackathon_settings')
                .select('value')
                .eq('key', 'round_configs')
                .maybeSingle();
            if (previousError) throw previousError;

            const evaluations: { round_id: string; status: string }[] = [];
            for (let offset = 0; ; offset += 1000) {
                const { data, error } = await supabase
                    .from('judging_evaluations')
                    .select('round_id, status')
                    .range(offset, offset + 999);
                if (error) throw error;
                evaluations.push(...(data || []));
                if (!data || data.length < 1000) break;
            }

            const previousRounds = normalizeJudgingRounds(previousSetting?.value);
            for (const evaluation of evaluations) {
                const previousRound = previousRounds.find(round => round.id === evaluation.round_id);
                const nextRound = nextRounds.find(round => round.id === evaluation.round_id);
                if (!nextRound) {
                    return NextResponse.json({ error: `Round ${evaluation.round_id} already has evaluations and cannot be removed.` }, { status: 409 });
                }
                if (previousRound && JSON.stringify(previousRound.criteria) !== JSON.stringify(nextRound.criteria)) {
                    return NextResponse.json({ error: `Round ${evaluation.round_id} already has evaluation activity; its rubric can no longer be changed.` }, { status: 409 });
                }
            }
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
