import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession, hasRole } from '@/lib/session';
import { getRosterAuditLogs } from '@/lib/roster-security';
import { getParticipantPortalMode } from '@/lib/event-windows';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const session = getSession(req);
    if (!hasRole(session, ['admin'])) {
        return NextResponse.json({ error: 'Admin authorization required.' }, { status: 401 });
    }

    try {
        const portalMode = await getParticipantPortalMode();
        const auditLogs = await getRosterAuditLogs();

        const { data: settingsData } = await supabase
            .from('hackathon_settings')
            .select('key, value')
            .in('key', [
                'participant_edit_start',
                'participant_edit_end',
                'participant_edit_override',
                'event_access_start',
                'event_access_end'
            ]);

        const settingsMap = Object.fromEntries((settingsData || []).map(r => [r.key, r.value]));

        // Get count of registered teams
        const { count: teamCount } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true });

        return NextResponse.json({
            success: true,
            portalMode,
            settings: settingsMap,
            teamCount: teamCount || 0,
            auditLogs: auditLogs.slice(0, 100)
        });
    } catch (err: unknown) {
        console.error('Roster Settings GET Error:', err);
        const message = err instanceof Error ? err.message : 'Failed to fetch roster settings.';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = getSession(req);
    if (!hasRole(session, ['admin'])) {
        return NextResponse.json({ error: 'Admin authorization required.' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { action, overrideValue, editStart, editEnd, eventStart, eventEnd } = body;

        if (action === 'set_override') {
            await supabase.from('hackathon_settings').upsert({
                key: 'participant_edit_override',
                value: overrideValue, // 'open' | 'closed' | 'event' | 'auto'
                updated_at: new Date().toISOString()
            });

            return NextResponse.json({
                success: true,
                message: `Portal window override set to: ${overrideValue}`
            });
        }

        if (action === 'set_dates') {
            const updates = [];
            if (editStart) updates.push({ key: 'participant_edit_start', value: editStart });
            if (editEnd) updates.push({ key: 'participant_edit_end', value: editEnd });
            if (eventStart) updates.push({ key: 'event_access_start', value: eventStart });
            if (eventEnd) updates.push({ key: 'event_access_end', value: eventEnd });

            for (const item of updates) {
                await supabase.from('hackathon_settings').upsert({
                    ...item,
                    updated_at: new Date().toISOString()
                });
            }

            return NextResponse.json({
                success: true,
                message: 'Event window dates updated successfully.'
            });
        }

        return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
    } catch (err: unknown) {
        console.error('Roster Settings POST Error:', err);
        const message = err instanceof Error ? err.message : 'Failed to save settings.';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
