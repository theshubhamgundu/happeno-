import { STATIC_ROUNDS_CONFIG } from '@/lib/constants';

export type JudgingCriterion = {
    id: string;
    label: string;
    desc?: string;
};

export type JudgingRound = {
    id: string;
    title: string;
    subtitle: string;
    dayOffset: number;
    hour: number;
    minute: number;
    criteria: JudgingCriterion[];
};

export function normalizeJudgingRounds(value: unknown): JudgingRound[] {
    const configured = Array.isArray(value) && value.length > 0
        ? value
        : STATIC_ROUNDS_CONFIG;
    const seenIds = new Set<string>();

    return configured.flatMap((entry, index) => {
        if (!entry || typeof entry !== 'object') return [];
        const round = entry as Record<string, unknown>;
        const id = typeof round.id === 'string' ? round.id.trim() : '';
        if (!id || seenIds.has(id)) return [];
        seenIds.add(id);

        const fallback = STATIC_ROUNDS_CONFIG.find(item => item.id === id);
        const rawCriteria = Array.isArray(round.criteria) ? round.criteria : fallback?.criteria || [];
        const criteria = rawCriteria.flatMap(item => {
            if (!item || typeof item !== 'object') return [];
            const criterion = item as Record<string, unknown>;
            const criterionId = typeof criterion.id === 'string' ? criterion.id.trim() : '';
            const label = typeof criterion.label === 'string' ? criterion.label.trim() : '';
            return criterionId && label
                ? [{ id: criterionId, label, desc: typeof criterion.desc === 'string' ? criterion.desc : '' }]
                : [];
        });
        if (!criteria.length || criteria.length > 20) return [];
        if (new Set(criteria.map(criterion => criterion.id)).size !== criteria.length) return [];

        const integerOr = (candidate: unknown, defaultValue: number) =>
            typeof candidate === 'number' && Number.isInteger(candidate) ? candidate : defaultValue;
        const dayOffset = integerOr(round.dayOffset, fallback?.dayOffset || 0);
        const hour = integerOr(round.hour, fallback?.hour || 0);
        const minute = integerOr(round.minute, fallback?.minute || 0);
        if (dayOffset < 0 || dayOffset > 7 || hour < 0 || hour > 23 || minute < 0 || minute > 59) return [];
        return [{
            id,
            title: typeof round.title === 'string' && round.title.trim() ? round.title.trim() : fallback?.title || `Round ${index + 1}`,
            subtitle: typeof round.subtitle === 'string' ? round.subtitle : fallback?.subtitle || '',
            dayOffset,
            hour,
            minute,
            criteria
        }];
    });
}

export function getRoundStartTime(startDateValue: unknown, round: JudgingRound): Date | null {
    if (typeof startDateValue !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(startDateValue)) return null;
    if (round.hour < 0 || round.hour > 23 || round.minute < 0 || round.minute > 59) return null;

    const [year, month, day] = startDateValue.slice(0, 10).split('-').map(Number);
    const localTimeAsUtc = Date.UTC(year, month - 1, day + round.dayOffset, round.hour, round.minute);
    return new Date(localTimeAsUtc - 5.5 * 60 * 60 * 1000);
}