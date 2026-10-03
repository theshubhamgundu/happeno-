import 'server-only';
import { supabase } from '@/lib/supabase';

export type ParticipantPortalMode = 'edit' | 'event' | 'closed';

const WINDOW_KEYS = [
    'participant_edit_start',
    'participant_edit_end',
    'participant_edit_override',
    'event_access_start',
    'event_access_end'
] as const;

export async function getParticipantPortalMode(now = new Date()): Promise<ParticipantPortalMode> {
    const { data, error } = await supabase
        .from('hackathon_settings')
        .select('key, value')
        .in('key', [...WINDOW_KEYS]);
    if (error) throw error;

    const settings = new Map((data || []).map(row => [row.key, row.value]));

    // Check manual override first
    const override = String(settings.get('participant_edit_override') || '').toLowerCase().trim();
    if (override === 'open' || override === 'edit') return 'edit';
    if (override === 'closed') return 'closed';
    if (override === 'event') return 'event';

    const editStart = Date.parse(String(settings.get('participant_edit_start') || '2026-10-05T00:01:00+05:30'));
    const editEnd = Date.parse(String(settings.get('participant_edit_end') || '2026-10-06T23:59:00+05:30'));
    const eventStart = Date.parse(String(settings.get('event_access_start') || '2026-10-09T23:59:00+05:30'));
    const eventEnd = Date.parse(String(settings.get('event_access_end') || '2026-10-12T10:00:00+05:30'));
    const current = now.getTime();

    if (Number.isFinite(editStart) && Number.isFinite(editEnd) && current >= editStart && current < editEnd) return 'edit';
    if (Number.isFinite(eventStart) && Number.isFinite(eventEnd) && current >= eventStart && current < eventEnd) return 'event';
    return 'closed';
}

