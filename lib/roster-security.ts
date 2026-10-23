import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { supabase } from '@/lib/supabase';
import { redis } from '@/lib/redis';
import { sendEmail } from '@/lib/email';
import { MAX_TEAM_MEMBERS } from '@/lib/constants';

const AUDIT_LOGS_KEY = 'roster_audit_logs';
const MERGE_CODES_PREFIX = 'roster_merge:';

function getRosterSecret(): string {
    return process.env.AUTH_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'happeno-secure-roster-secret-2026';
}

/**
 * Generate a cryptographic HMAC-SHA256 magic link token for a team lead.
 */
export function generateRosterToken(teamId: string, captainIdentifier: string): string {
    const cleanId = (teamId || '').trim().toUpperCase();
    const cleanContact = (captainIdentifier || '').trim().toLowerCase();
    return createHmac('sha256', getRosterSecret())
        .update(`${cleanId}:${cleanContact}`)
        .digest('hex');
}

/**
 * Verify a team lead's magic link token.
 */
export function verifyRosterToken(teamId: string, captainIdentifier: string, token: string): boolean {
    if (!teamId || !captainIdentifier || !token) return false;
    try {
        const expected = generateRosterToken(teamId, captainIdentifier);
        if (expected.length !== token.length) return false;
        return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
    } catch {
        return false;
    }
}

export interface RosterAuditEntry {
    id: string;
    teamId: string;
    action: 'UPDATE_DETAILS' | 'FINALIZE_AND_LOCK' | 'REPLACE_MEMBER' | 'MERGE_TEAMS' | 'SWAP_REQUEST';
    timestamp: string;
    ip: string;
    actor: string;
    summary: string;
    previousState?: unknown;
    newState?: unknown;
}

/**
 * Append an immutable entry to the roster audit trail.
 */
export async function recordRosterAudit(entry: Omit<RosterAuditEntry, 'id' | 'timestamp'>): Promise<void> {
    const fullEntry: RosterAuditEntry = {
        ...entry,
        id: `AUDIT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toISOString()
    };

    try {
        if (redis) {
            await redis.lpush(AUDIT_LOGS_KEY, JSON.stringify(fullEntry));
            await redis.ltrim(AUDIT_LOGS_KEY, 0, 999); // keep last 1000 logs
        }

        // Also persist in Supabase settings for permanent storage
        const { data } = await supabase
            .from('hackathon_settings')
            .select('value')
            .eq('key', AUDIT_LOGS_KEY)
            .maybeSingle();

        const existing: RosterAuditEntry[] = Array.isArray(data?.value) ? data.value : [];
        const updated = [fullEntry, ...existing].slice(0, 1000);

        await supabase.from('hackathon_settings').upsert({
            key: AUDIT_LOGS_KEY,
            value: updated,
            updated_at: new Date().toISOString()
        });
    } catch (err) {
        console.error('Failed to record roster audit log:', err);
    }
}

/**
 * Fetch roster audit logs, optionally filtered by team ID.
 */
export async function getRosterAuditLogs(teamId?: string): Promise<RosterAuditEntry[]> {
    try {
        if (redis) {
            const raw = await redis.lrange(AUDIT_LOGS_KEY, 0, 200);
            if (raw && raw.length > 0) {
                const parsed = raw.map(item => typeof item === 'string' ? JSON.parse(item) : item);
                if (teamId) return parsed.filter((l: RosterAuditEntry) => l.teamId === teamId);
                return parsed;
            }
        }

        const { data } = await supabase
            .from('hackathon_settings')
            .select('value')
            .eq('key', AUDIT_LOGS_KEY)
            .maybeSingle();

        const logs: RosterAuditEntry[] = Array.isArray(data?.value) ? data.value : [];
        if (teamId) return logs.filter(l => l.teamId === teamId);
        return logs;
    } catch (err) {
        console.error('Failed to retrieve audit logs:', err);
        return [];
    }
}

/**
 * Rate limit check for sensitive roster operations (brute-force defense).
 */
export async function rateLimitRosterAction(ip: string, maxAttempts = 10, windowSecs = 900): Promise<boolean> {
    if (!redis) return true; // graceful fallback if Redis not active
    try {
        const key = `rate_roster:${ip}`;
        const attempts = await redis.incr(key);
        if (attempts === 1) {
            await redis.expire(key, windowSecs);
        }
        return attempts <= maxAttempts;
    } catch {
        return true;
    }
}

export interface MergeProposal {
    code: string;
    sourceTeamId: string;
    sourceTeamName: string;
    sourceCaptain: string;
    sourceEmail: string;
    sourceMemberCount: number;
    targetTeamId?: string;
    targetTeamName?: string;
    targetCaptain?: string;
    targetEmail?: string;
    targetMemberCount?: number;
    status: 'ACTIVE' | 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
    createdAt: string;
    expiresAt: string;
}

/**
 * Generate a 6-digit temporary merge invite code (valid for 30 minutes).
 */
export async function createMergeInvite(sourceTeam: {
    id: string;
    name: string;
    captain: string;
    email: string;
    memberCount: number;
}): Promise<string> {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let randomPart = '';
    for (let i = 0; i < 4; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const code = `MG-${randomPart}`;

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const proposal: MergeProposal = {
        code,
        sourceTeamId: sourceTeam.id,
        sourceTeamName: sourceTeam.name,
        sourceCaptain: sourceTeam.captain,
        sourceEmail: sourceTeam.email,
        sourceMemberCount: sourceTeam.memberCount,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        expiresAt
    };

    if (redis) {
        await redis.set(`${MERGE_CODES_PREFIX}${code}`, JSON.stringify(proposal), { ex: 1800 });
        await redis.set(`roster_team_merge:${sourceTeam.id}`, code, { ex: 1800 });
    } else {
        const { data } = await supabase.from('hackathon_settings').select('value').eq('key', 'active_merge_proposals').maybeSingle();
        const proposals: Record<string, MergeProposal> = (data?.value && typeof data.value === 'object') ? data.value : {};
        proposals[code] = proposal;
        await supabase.from('hackathon_settings').upsert({
            key: 'active_merge_proposals',
            value: proposals,
            updated_at: new Date().toISOString()
        });
    }

    return code;
}

/**
 * Look up a merge code.
 */
export async function getMergeInvite(code: string): Promise<MergeProposal | null> {
    const cleanCode = code.trim().toUpperCase();
    if (redis) {
        const raw = await redis.get(`${MERGE_CODES_PREFIX}${cleanCode}`);
        if (!raw) return null;
        return typeof raw === 'string' ? JSON.parse(raw) : (raw as MergeProposal);
    }

    const { data } = await supabase.from('hackathon_settings').select('value').eq('key', 'active_merge_proposals').maybeSingle();
    const proposals: Record<string, MergeProposal> = (data?.value && typeof data.value === 'object') ? data.value : {};
    return proposals[cleanCode] || null;
}

/**
 * Team B submits a request to merge with Team A using Team A's merge code.
 */
export async function submitMergeRequest(
    code: string,
    targetTeam: { id: string; name: string; captain: string; email: string; memberCount: number }
): Promise<{ success: boolean; message: string }> {
    const proposal = await getMergeInvite(code);
    if (!proposal) {
        return { success: false, message: 'Invalid or expired merge code. Please ask Team Lead A for a new code.' };
    }

    if (new Date(proposal.expiresAt).getTime() < Date.now()) {
        return { success: false, message: 'This merge code has expired. Please generate a new one.' };
    }

    if (proposal.sourceTeamId === targetTeam.id) {
        return { success: false, message: 'You cannot merge a team with itself.' };
    }

    const totalMembers = proposal.sourceMemberCount + targetTeam.memberCount;
    if (totalMembers === 3) {
        return {
            success: false,
            message: 'Cannot merge: Solo (1) + Duo (2) = 3 members is prohibited. event rules strictly require Solo (1), Duo (2), or Quad (4) teams only.'
        };
    }

    if (totalMembers > MAX_TEAM_MEMBERS) {
        return {
            success: false,
            message: `Cannot merge: Combined team would have ${totalMembers} members, exceeding the ${MAX_TEAM_MEMBERS}-member limit.`
        };
    }

    proposal.targetTeamId = targetTeam.id;
    proposal.targetTeamName = targetTeam.name;
    proposal.targetCaptain = targetTeam.captain;
    proposal.targetEmail = targetTeam.email;
    proposal.targetMemberCount = targetTeam.memberCount;
    proposal.status = 'REQUESTED';

    if (redis) {
        await redis.set(`${MERGE_CODES_PREFIX}${code}`, JSON.stringify(proposal), { ex: 1800 });
        await redis.set(`roster_pending_merge:${proposal.sourceTeamId}`, JSON.stringify(proposal), { ex: 1800 });
    } else {
        const { data } = await supabase.from('hackathon_settings').select('value').eq('key', 'active_merge_proposals').maybeSingle();
        const proposals: Record<string, MergeProposal> = (data?.value && typeof data.value === 'object') ? data.value : {};
        proposals[code] = proposal;
        await supabase.from('hackathon_settings').upsert({
            key: 'active_merge_proposals',
            value: proposals,
            updated_at: new Date().toISOString()
        });
    }

    // Send instant alert email to Team A lead requesting approval
    try {
        await sendEmail({
            to: proposal.sourceEmail,
            subject: `[ACTION REQUIRED] Merge Request from Team "${targetTeam.name}"`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
                    <div style="background: #0f172a; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
                        <h2 style="color: #14b8a6; margin: 0; font-size: 20px;">TEAM MERGE PROPOSAL</h2>
                        <p style="color: #94a3b8; font-size: 12px; margin: 6px 0 0 0;">Tri-City AI Hackathon 2026</p>
                    </div>
                    <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; background: #ffffff;">
                        <p>Hello <strong>${proposal.sourceCaptain}</strong>,</p>
                        <p>Team <strong>${targetTeam.name}</strong> (Lead: <strong>${targetTeam.captain}</strong>) has entered your merge code <strong>${code}</strong>.</p>
                        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 16px 0;">
                            <p style="margin: 0; font-size: 13px;"><strong>Your Team:</strong> ${proposal.sourceTeamName} (${proposal.sourceMemberCount} members)</p>
                            <p style="margin: 6px 0 0 0; font-size: 13px;"><strong>Merging With:</strong> ${targetTeam.name} (${targetTeam.memberCount} members)</p>
                            <p style="margin: 6px 0 0 0; font-size: 13px; color: #0d9488;"><strong>New Total:</strong> ${totalMembers} / ${MAX_TEAM_MEMBERS} members</p>
                        </div>
                        <p style="font-size: 13px; color: #64748b;">
                            Please return to your <strong>Team Edit Portal</strong> to <strong>Approve</strong> or <strong>Reject</strong> this merge. No changes will happen without your confirmation.
                        </p>
                    </div>
                </div>
            `
        });
    } catch (e) {
        console.warn('Failed to send merge alert email:', e);
    }

    return {
        success: true,
        message: `Merge request sent to ${proposal.sourceTeamName} (Lead: ${proposal.sourceCaptain}). Waiting for their approval!`
    };
}

/**
 * Check if a team has any pending merge proposal awaiting their approval.
 */
export async function getPendingMergeForTeam(teamId: string): Promise<MergeProposal | null> {
    if (redis) {
        const raw = await redis.get(`roster_pending_merge:${teamId}`);
        if (raw) return typeof raw === 'string' ? JSON.parse(raw) : (raw as MergeProposal);
    }

    const { data } = await supabase.from('hackathon_settings').select('value').eq('key', 'active_merge_proposals').maybeSingle();
    const proposals: Record<string, MergeProposal> = (data?.value && typeof data.value === 'object') ? data.value : {};
    for (const p of Object.values(proposals)) {
        if (p.sourceTeamId === teamId && p.status === 'REQUESTED') {
            return p;
        }
    }
    return null;
}

/**
 * Delete a merge proposal (clean up tokens).
 */
export async function deleteMergeProposal(code: string, teamId: string): Promise<void> {
    if (redis) {
        await redis.del(`${MERGE_CODES_PREFIX}${code}`);
        await redis.del(`roster_pending_merge:${teamId}`);
    } else {
        const { data } = await supabase.from('hackathon_settings').select('value').eq('key', 'active_merge_proposals').maybeSingle();
        const proposals: Record<string, MergeProposal> = (data?.value && typeof data.value === 'object') ? data.value : {};
        if (proposals[code]) {
            delete proposals[code];
            await supabase.from('hackathon_settings').upsert({ key: 'active_merge_proposals', value: proposals });
        }
    }
}
