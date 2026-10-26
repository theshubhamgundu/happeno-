import 'server-only';
import { createHash } from 'node:crypto';
import { supabase } from '@/lib/supabase';

export interface CertificateConfig {
    is_enabled: boolean;
    unlock_at: string | null; // ISO string or null
    require_feedback: boolean;
    require_checkin: boolean;
    event_title: string;
    issuer_name: string;
    signatory_1_name: string;
    signatory_1_title: string;
    signatory_2_name: string;
    signatory_2_title: string;
    issue_date: string;
    custom_subtitle: string;
}

export type LikertRating = "Excellent" | "Good" | "Average" | "Poor" | "Didn't attend / use";

export interface CertificateFeedbackPayload {
    team_id: string;
    team_name?: string;
    submitted_by_name: string;
    submitted_by_email: string;
    rating_overall: number;
    // Food ratings
    food_lunch_d1?: LikertRating;
    food_dinner_d1?: LikertRating;
    food_stalls?: LikertRating;
    // Venue & facilities
    venue_workspace?: LikertRating;
    venue_wifi_power?: LikertRating;
    venue_restrooms?: LikertRating;
    venue_night_security?: LikertRating;
    venue_volunteers?: LikertRating;
    // Technical support & evaluation
    tech_credentials?: LikertRating;
    tech_mentor_support?: LikertRating;
    tech_evaluation_fairness?: LikertRating;
    // Qualitative
    feedback_text: string;
    highlight: string;
    created_at?: string;
}

export interface CertificateClaimRecord {
    certificate_id: string;
    team_id: string;
    team_name: string;
    member_name: string;
    member_email: string;
    role: string;
    issued_at: string;
    verification_hash: string;
}

export const DEFAULT_CERTIFICATE_CONFIG: CertificateConfig = {
    is_enabled: true,
    unlock_at: null,
    require_feedback: true,
    require_checkin: false,
    event_title: 'Happeno Hackathon',
    issuer_name: 'Happeno Council of Organizers',
    signatory_1_name: 'Organizing Chair',
    signatory_1_title: 'Head of Operations',
    signatory_2_name: 'Grand Jury Lead',
    signatory_2_title: 'Technical Evaluation Council',
    issue_date: 'October 2026',
    custom_subtitle: 'For exceptional dedication, collaborative engineering, and successful presentation of their project.'
};

/**
 * Fetch certificate master configuration from hackathon_settings
 */
export async function getCertificateConfig(): Promise<CertificateConfig> {
    try {
        const { data, error } = await supabase
            .from('hackathon_settings')
            .select('value')
            .eq('key', 'certificate_config')
            .maybeSingle();

        if (error || !data || !data.value) {
            return DEFAULT_CERTIFICATE_CONFIG;
        }

        return {
            ...DEFAULT_CERTIFICATE_CONFIG,
            ...(typeof data.value === 'object' ? data.value : {})
        };
    } catch (err) {
        console.error('getCertificateConfig error:', err);
        return DEFAULT_CERTIFICATE_CONFIG;
    }
}

/**
 * Update certificate master configuration
 */
export async function updateCertificateConfig(patch: Partial<CertificateConfig>): Promise<CertificateConfig> {
    const current = await getCertificateConfig();
    const updated: CertificateConfig = {
        ...current,
        ...patch
    };

    await supabase.from('hackathon_settings').upsert({
        key: 'certificate_config',
        value: updated,
        updated_at: new Date().toISOString()
    });

    return updated;
}

/**
 * Evaluate window state (unlocked vs locked countdown)
 */
export function evaluateWindowState(config: CertificateConfig): {
    is_open: boolean;
    is_enabled: boolean;
    unlock_at: string | null;
    time_remaining_ms: number;
    lock_reason: string | null;
} {
    if (!config.is_enabled) {
        return {
            is_open: false,
            is_enabled: false,
            unlock_at: config.unlock_at,
            time_remaining_ms: 0,
            lock_reason: 'Certificate claiming is currently disabled by organizers.'
        };
    }

    if (!config.unlock_at) {
        // Enabled without scheduled date means open immediately
        return {
            is_open: true,
            is_enabled: true,
            unlock_at: null,
            time_remaining_ms: 0,
            lock_reason: null
        };
    }

    const unlockTime = new Date(config.unlock_at).getTime();
    const now = Date.now();
    const diff = unlockTime - now;

    if (diff > 0) {
        return {
            is_open: false,
            is_enabled: true,
            unlock_at: config.unlock_at,
            time_remaining_ms: diff,
            lock_reason: `Certificate window unlocks in ${formatRemainingTime(diff)}.`
        };
    }

    return {
        is_open: true,
        is_enabled: true,
        unlock_at: config.unlock_at,
        time_remaining_ms: 0,
        lock_reason: null
    };
}

function formatRemainingTime(ms: number): string {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m ${seconds}s`;
}

/**
 * Check if a team has already submitted feedback
 */
export async function hasTeamSubmittedFeedback(teamId: string): Promise<boolean> {
    const cleanTeamId = teamId.trim().toUpperCase();

    // 1. Try dedicated table
    try {
        const { data, error } = await supabase
            .from('certificate_feedback')
            .select('id')
            .ilike('team_id', cleanTeamId)
            .limit(1);

        if (!error && data && data.length > 0) {
            return true;
        }
    } catch {
        // Fallback to registrations.raw_data
    }

    // 2. Check registrations.raw_data
    try {
        const { data: teamData } = await supabase
            .from('registrations')
            .select('raw_data')
            .eq('team_id', cleanTeamId)
            .maybeSingle();

        if (teamData?.raw_data && typeof teamData.raw_data === 'object') {
            const raw = teamData.raw_data as Record<string, any>;
            if (raw.certificate_feedback || raw.feedbackSubmittedAt) {
                return true;
            }
        }
    } catch (err) {
        console.error('hasTeamSubmittedFeedback error:', err);
    }

    return false;
}

export function likertToScore(val?: LikertRating): number | null {
    if (!val) return null;
    if (val === "Excellent") return 5;
    if (val === "Good") return 4;
    if (val === "Average") return 3;
    if (val === "Poor") return 2;
    return null; // "Didn't attend / use"
}

/**
 * Submit feedback with dual-layer persistence
 */
export async function submitCertificateFeedback(payload: CertificateFeedbackPayload): Promise<boolean> {
    const cleanTeamId = payload.team_id.trim().toUpperCase();
    const now = new Date().toISOString();

    // 1. Try insert into certificate_feedback table
    try {
        await supabase.from('certificate_feedback').insert({
            team_id: cleanTeamId,
            team_name: payload.team_name || '',
            submitted_by_name: payload.submitted_by_name || '',
            submitted_by_email: payload.submitted_by_email || '',
            rating_overall: Math.min(5, Math.max(1, Number(payload.rating_overall) || 5)),
            feedback_text: payload.feedback_text || '',
            highlight: payload.highlight || '',
            created_at: now
        });
    } catch (err) {
        console.warn('certificate_feedback table insert notice, using raw_data fallback:', err);
    }

    // 2. Guaranteed fallback in registrations.raw_data with full matrix
    try {
        const { data: teamData } = await supabase
            .from('registrations')
            .select('raw_data')
            .eq('team_id', cleanTeamId)
            .maybeSingle();

        const currentRaw = (teamData?.raw_data && typeof teamData.raw_data === 'object')
            ? (teamData.raw_data as Record<string, any>)
            : {};

        const updatedRaw = {
            ...currentRaw,
            certificate_feedback: {
                ...payload,
                submittedAt: now
            },
            feedbackSubmittedAt: now
        };

        await supabase
            .from('registrations')
            .update({ raw_data: updatedRaw })
            .eq('team_id', cleanTeamId);

        return true;
    } catch (err) {
        console.error('submitCertificateFeedback error:', err);
        return false;
    }
}

/**
 * Generate unique certificate ID and verification hash
 */
export function generateCertificateMetadata(teamId: string, memberIndex: number, memberName: string): {
    certificate_id: string;
    verification_hash: string;
} {
    const cleanTeamId = teamId.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const cleanName = memberName.trim().toUpperCase();
    const seed = `${cleanTeamId}-${memberIndex}-${cleanName}-HAPPENO-2026`;
    const hash = createHash('sha256').update(seed).digest('hex');
    const shortCode = hash.substring(0, 8).toUpperCase();
    const certificate_id = `HAP-CERT-${cleanTeamId}-${shortCode}`;

    return {
        certificate_id,
        verification_hash: hash
    };
}

export interface NormalizedMember {
    name: string;
    email: string;
    role: string;
    index: number;
}

/**
 * Deduplicate and normalize team members so team leads and members are never duplicated
 */
export function getNormalizedTeamMembers(team: {
    captain?: string | null;
    email?: string | null;
    members?: any[] | null;
}): NormalizedMember[] {
    const rawMembers: any[] = Array.isArray(team.members) ? team.members : [];
    const captainName = (team.captain || '').trim();
    const result: NormalizedMember[] = [];
    const seenNames = new Set<string>();

    const clean = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Process members from rawMembers
    rawMembers.forEach((m, idx) => {
        const name = (typeof m === 'string' ? m : m.fullName || m.name || '').trim();
        if (!name) return;
        const key = clean(name);
        if (seenNames.has(key)) return;
        seenNames.add(key);

        const isLead = Boolean(
            m.is_lead || 
            (captainName && clean(captainName) === key) || 
            (idx === 0 && (!captainName || clean(captainName) === key))
        );

        result.push({
            name,
            email: m.email || (isLead ? (team.email || '') : ''),
            role: isLead ? 'Team Lead' : 'Team Member',
            index: result.length
        });
    });

    // If captain was not found in rawMembers, prepend captain
    if (captainName && !seenNames.has(clean(captainName))) {
        result.unshift({
            name: captainName,
            email: team.email || '',
            role: 'Team Lead',
            index: 0
        });
        // Re-index
        result.forEach((m, i) => { m.index = i; });
    }

    // Ensure at least one member has role 'Team Lead'
    if (result.length > 0 && !result.some(m => m.role === 'Team Lead')) {
        result[0].role = 'Team Lead';
    }

    return result;
}

/**
 * Fetch or record certificate claim
 */
export async function claimCertificateForMember(params: {
    team_id: string;
    team_name: string;
    member_name: string;
    member_email: string;
    member_index: number;
    role?: string;
}): Promise<CertificateClaimRecord> {
    const { team_id, team_name, member_name, member_email, member_index, role = 'Participant' } = params;
    const { certificate_id, verification_hash } = generateCertificateMetadata(team_id, member_index, member_name);
    const now = new Date().toISOString();

    const record: CertificateClaimRecord = {
        certificate_id,
        team_id,
        team_name,
        member_name,
        member_email,
        role,
        issued_at: now,
        verification_hash
    };

    // Try save to certificate_claims table
    try {
        await supabase.from('certificate_claims').upsert({
            certificate_id,
            team_id,
            team_name,
            member_name,
            member_email,
            role,
            verification_hash,
            issued_at: now
        }, { onConflict: 'certificate_id' });
    } catch {
        // Fallback to registrations.raw_data
        try {
            const { data: teamData } = await supabase
                .from('registrations')
                .select('raw_data')
                .eq('team_id', team_id)
                .maybeSingle();

            const currentRaw = (teamData?.raw_data && typeof teamData.raw_data === 'object')
                ? (teamData.raw_data as Record<string, any>)
                : {};

            const claims = (currentRaw.certificate_claims && typeof currentRaw.certificate_claims === 'object')
                ? { ...currentRaw.certificate_claims }
                : {};

            claims[certificate_id] = record;

            await supabase
                .from('registrations')
                .update({ raw_data: { ...currentRaw, certificate_claims: claims } })
                .eq('team_id', team_id);
        } catch (fallbackErr) {
            console.error('Claim fallback error:', fallbackErr);
        }
    }

    return record;
}

/**
 * Public certificate lookup by Certificate ID
 */
export async function verifyCertificateById(certificateId: string): Promise<CertificateClaimRecord | null> {
    const cleanId = certificateId.trim().toUpperCase();

    // 1. Check certificate_claims table
    try {
        const { data, error } = await supabase
            .from('certificate_claims')
            .select('*')
            .eq('certificate_id', cleanId)
            .maybeSingle();

        if (!error && data) {
            return {
                certificate_id: data.certificate_id,
                team_id: data.team_id,
                team_name: data.team_name,
                member_name: data.member_name,
                member_email: data.member_email,
                role: data.role || 'Participant',
                issued_at: data.issued_at,
                verification_hash: data.verification_hash
            };
        }
    } catch {
        // Fallback
    }

    // 2. Check registrations.raw_data across teams
    try {
        // Extract team id part: HAP-CERT-[TEAM_ID]-[HASH]
        const parts = cleanId.split('-');
        if (parts.length >= 4) {
            const suspectedTeamId = parts[2];
            const { data: team } = await supabase
                .from('registrations')
                .select('team_id, team_name, raw_data, captain, members')
                .ilike('team_id', `%${suspectedTeamId}%`)
                .maybeSingle();

            if (team) {
                const raw = (team.raw_data && typeof team.raw_data === 'object') ? team.raw_data as any : {};
                if (raw.certificate_claims && raw.certificate_claims[cleanId]) {
                    return raw.certificate_claims[cleanId];
                }

                // Verify against normalized members (deduplicated)
                const members = getNormalizedTeamMembers(team);

                for (let i = 0; i < members.length; i++) {
                    const mName = members[i].name;
                    if (!mName) continue;
                    const meta = generateCertificateMetadata(team.team_id, members[i].index, mName);
                    if (meta.certificate_id === cleanId) {
                        return {
                            certificate_id: cleanId,
                            team_id: team.team_id,
                            team_name: team.team_name,
                            member_name: mName,
                            member_email: members[i].email || '',
                            role: members[i].role,
                            issued_at: team.raw_data?.feedbackSubmittedAt || new Date().toISOString(),
                            verification_hash: meta.verification_hash
                        };
                    }
                }
            }
        }
    } catch (err) {
        console.error('verifyCertificateById error:', err);
    }

    return null;
}

/**
 * Fetch feedback submissions & analytics for organizers
 */
export async function getFeedbackAnalytics(): Promise<{
    totalSubmissions: number;
    averageRatings: {
        overall: number;
        organization: number;
        mentorship: number;
        judging: number;
        food: number;
    };
    recentFeedbacks: CertificateFeedbackPayload[];
}> {
    try {
        const { data, error } = await supabase
            .from('certificate_feedback')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
            const count = data.length;
            const sum = data.reduce((acc, row) => ({
                overall: acc.overall + (Number(row.rating_overall) || 0),
                organization: acc.organization + (Number(row.rating_organization) || 0),
                mentorship: acc.mentorship + (Number(row.rating_mentorship) || 0),
                judging: acc.judging + (Number(row.rating_judging) || 0),
                food: acc.food + (Number(row.rating_food) || 0)
            }), { overall: 0, organization: 0, mentorship: 0, judging: 0, food: 0 });

            return {
                totalSubmissions: count,
                averageRatings: {
                    overall: Number((sum.overall / count).toFixed(1)),
                    organization: Number((sum.organization / count).toFixed(1)),
                    mentorship: Number((sum.mentorship / count).toFixed(1)),
                    judging: Number((sum.judging / count).toFixed(1)),
                    food: Number((sum.food / count).toFixed(1))
                },
                recentFeedbacks: data.slice(0, 100)
            };
        }
    } catch {
        // Fallback
    }

    // Fallback: check registrations raw_data
    try {
        const { data: teams } = await supabase
            .from('registrations')
            .select('team_id, team_name, raw_data');

        const fallbackList: CertificateFeedbackPayload[] = [];
        (teams || []).forEach(team => {
            const raw = (team.raw_data && typeof team.raw_data === 'object') ? team.raw_data as any : {};
            if (raw.certificate_feedback) {
                fallbackList.push({
                    team_id: team.team_id,
                    team_name: team.team_name,
                    ...raw.certificate_feedback
                });
            }
        });

        const count = fallbackList.length;
        if (count === 0) {
            return {
                totalSubmissions: 0,
                averageRatings: { overall: 5, organization: 5, mentorship: 5, judging: 5, food: 5 },
                recentFeedbacks: []
            };
        }

        const computeAvg = (scores: (number | null)[]) => {
            const valid = scores.filter((s): s is number => typeof s === 'number');
            if (valid.length === 0) return 5;
            return Number((valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1));
        };

        const allFoodScores: (number | null)[] = [];
        const allVenueScores: (number | null)[] = [];
        const allTechScores: (number | null)[] = [];
        let totalOverall = 0;

        fallbackList.forEach(row => {
            totalOverall += Number(row.rating_overall) || 5;
            allFoodScores.push(likertToScore(row.food_lunch_d1), likertToScore(row.food_dinner_d1), likertToScore(row.food_stalls));
            allVenueScores.push(
                likertToScore(row.venue_workspace),
                likertToScore(row.venue_wifi_power),
                likertToScore(row.venue_restrooms),
                likertToScore(row.venue_night_security),
                likertToScore(row.venue_volunteers)
            );
            allTechScores.push(
                likertToScore(row.tech_credentials),
                likertToScore(row.tech_mentor_support),
                likertToScore(row.tech_evaluation_fairness)
            );
        });

        return {
            totalSubmissions: count,
            averageRatings: {
                overall: Number((totalOverall / count).toFixed(1)),
                organization: computeAvg(allVenueScores),
                mentorship: computeAvg(allTechScores),
                judging: computeAvg(fallbackList.map(r => likertToScore(r.tech_evaluation_fairness))),
                food: computeAvg(allFoodScores)
            },
            recentFeedbacks: fallbackList.slice(0, 100)
        };
    } catch (err) {
        console.error('getFeedbackAnalytics error:', err);
        return {
            totalSubmissions: 0,
            averageRatings: { overall: 5, organization: 5, mentorship: 5, judging: 5, food: 5 },
            recentFeedbacks: []
        };
    }
}
