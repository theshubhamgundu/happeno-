import 'server-only';
import { supabase } from '@/lib/supabase';

export type ParticipantPortalMode = 'edit' | 'event' | 'closed';

const WINDOW_KEYS = [
    'participant_edit_start',
    'participant_edit_end',
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
    const editStart = Date.parse(String(settings.get('participant_edit_start') || ''));
    const editEnd = Date.parse(String(settings.get('participant_edit_end') || ''));
    const eventStart = Date.parse(String(settings.get('event_access_start') || ''));
    const eventEnd = Date.parse(String(settings.get('event_access_end') || ''));
    const current = now.getTime();

    if (Number.isFinite(editStart) && Number.isFinite(editEnd) && current >= editStart && current < editEnd) return 'edit';
    if (Number.isFinite(eventStart) && Number.isFinite(eventEnd) && current >= eventStart && current < eventEnd) return 'event';
    return 'closed';
}
