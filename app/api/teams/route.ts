import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { MAX_PROPOSED_IDEA_CHARACTERS, MAX_TEAM_MEMBERS } from '@/lib/constants';
import { getSession, hasRole } from '@/lib/session';
import { getParticipantPortalMode } from '@/lib/event-windows';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

// In-Memory L1 Cache to save Redis commands during heavy traffic
const memoryCache: Record<string, { data: any; timestamp: number }> = {};
const MEMORY_CACHE_TTL = 30000; // 30 seconds


function isEnabledFlag(value: unknown): boolean {
    return value === true || (typeof value === 'string' && value.toLowerCase() === 'true');
}

function memberName(member: unknown): string {
    if (typeof member === 'string') return member;
    if (!member || typeof member !== 'object') return '';
    const value = member as { fullName?: string; name?: string };
    return value.fullName || value.name || '';
}

function memberEmail(member: unknown): string {
    if (!member || typeof member !== 'object') return '';
    return (member as { email?: string }).email || '';
}

function memberContributionKey(member: unknown, index: number): string {
    const email = memberEmail(member).trim().toLowerCase();
    if (email) return `email:${email}`;
    return `member:${memberName(member).trim().toLowerCase()}:${index}`;
}

function teamResponse(row: Record<string, unknown>) {
    const rawData = row.raw_data && typeof row.raw_data === 'object'
        ? row.raw_data as Record<string, unknown>
        : {};
    const members = Array.isArray(row.members) ? row.members : [];
    const savedContributions = rawData.member_contributions && typeof rawData.member_contributions === 'object'
        ? rawData.member_contributions as Record<string, unknown>
        : {};
    return {
        id: row.transaction_id || '',
        name: row.team_name || 'Unknown Team',
        team: row.team_name || 'Unknown Team',
        track: (row.track as string) || (rawData.track as string) || '',
        captain: row.captain || 'N/A',
        captainMobile: row.captain_mobile || '',
        college: row.college || '',
        teamId: row.team_id || '',
        members,
        memberContributions: members.map((member, index) => {
            const contribution = savedContributions[memberContributionKey(member, index)];
            return typeof contribution === 'string' ? contribution : '';
        }),
        status: row.status || 'PENDING',
        problemStatement: (row.problem_statement as string) || (rawData.problem_statement as string) || (rawData.problemStatement as string) || '',
        proposedIdea: row.proposed_idea || (rawData.proposed_idea as string) || (rawData.proposedIdea as string) || '',
        techStack: row.tech_stack || rawData.tech_stack || rawData.techStack || {},
        isPSLocked: Boolean(rawData.ps_locked || (row.problem_statement && row.track)),
        isPILocked: rawData.pi_locked || false,
        isTSLocked: rawData.ts_locked || false,
        trackPreferences: row.track_preferences || [],
        submission: {
            github: row.github_url || '',
            presentation: row.presentation_url || '',
            demo: row.demo_url || '',
            deployment: row.deployment_url || '',
            projectZip: typeof rawData.project_zip_url === 'string' ? rawData.project_zip_url : '',
            isFinal: row.is_final_submission || false
        },
        roundScores: row.round_scores || {},
        roundDetailedScores: row.round_detailed_scores || {},
        roundComments: row.round_comments || {},
        preScore: Number(rawData.rabbit_race_score) || 0,
        isEliminated: row.is_eliminated || false,
        isCheckedIn: row.is_checked_in || false,
        checkedInAt: rawData.checkedInAt || null,
        memberMealState: row.member_meal_state || rawData.memberMealState || {},
        mealAccess: row.meal_access || {},
        room: row.room || '',
        roomWifiSSID: row.room_wifi_ssid || '',
        roomWifiPass: row.room_wifi_pass || '',
        coordinator: {
            name: row.volunteer_name || '',
            phone: row.volunteer_phone || '',
            assigned_judge: row.assigned_judge || '',
            assigned_judge_2: rawData.assigned_judge_2 || ''
        },
        createdAt: row.created_at,
        completedAt: row.completed_at
    };
}

async function findRegistration(id: string) {
    const byTransaction = await supabase
        .from('registrations')
        .select('*')
        .eq('transaction_id', id)
        .maybeSingle();
    if (byTransaction.error) throw byTransaction.error;
    if (byTransaction.data) return byTransaction.data;

    const byTeam = await supabase
        .from('registrations')
        .select('*')
        .eq('team_id', id)
        .maybeSingle();
    if (byTeam.error) throw byTeam.error;
    return byTeam.data;
}

async function transferTeamMembers(targetId: string, selections: { sourceTeamId: string; memberIndex: number }[]) {
    if (!selections.length) throw new Error('Select at least one participant to move.');

    const sourceIds = [...new Set(selections.map(selection => selection.sourceTeamId))];
    if (sourceIds.includes(targetId)) throw new Error('Choose participants from other teams.');

    const lookupIds = [...sourceIds, targetId];
    const { data: transactionRows, error: transactionError } = await supabase
        .from('registrations')
        .select('transaction_id, team_id, team_name, members, member_meal_state, raw_data, captain, captain_mobile, college')
        .in('transaction_id', lookupIds);
    if (transactionError) throw transactionError;

    const foundIds = new Set((transactionRows || []).flatMap(row => [row.transaction_id, row.team_id]));
    const unresolvedTeamIds = lookupIds.filter(id => !foundIds.has(id));
    const { data: teamIdRows, error: teamIdError } = unresolvedTeamIds.length
        ? await supabase
            .from('registrations')
            .select('transaction_id, team_id, team_name, members, member_meal_state, raw_data, captain, captain_mobile, college')
            .in('team_id', unresolvedTeamIds)
        : { data: [], error: null };
    if (teamIdError) throw teamIdError;

    const rowsByTransaction = new Map([...(transactionRows || []), ...(teamIdRows || [])].map(row => [row.transaction_id, row]));
    const rows = [...rowsByTransaction.values()];
    const byTeamId = new Map<string, typeof rows[number]>();
    for (const row of rows) {
        byTeamId.set(row.team_id, row);
        byTeamId.set(row.transaction_id, row);
    }
    const target = byTeamId.get(targetId);
    if (!target) throw new Error('The destination team could not be found. Refresh and try again.');
    if (sourceIds.some(id => byTeamId.get(id)?.transaction_id === target.transaction_id)) {
        throw new Error('Choose participants from other teams.');
    }

    const sourceRows = sourceIds.map(id => byTeamId.get(id));
    if (sourceRows.some(row => !row)) throw new Error('A source team could not be found. Refresh and try again.');

    const selectionKeys = new Set<string>();
    const selectionsBySource = new Map<string, Set<number>>();
    const movedMembers: unknown[] = [];
    const targetMealState = { ...(target.member_meal_state || target.raw_data?.memberMealState || {}) };

    for (const selection of selections) {
        const selectionKey = `${selection.sourceTeamId}:${selection.memberIndex}`;
        if (selectionKeys.has(selectionKey)) throw new Error('A participant can only be selected once.');
        selectionKeys.add(selectionKey);

        const source = byTeamId.get(selection.sourceTeamId);
        const sourceMembers = source?.members || [];
        const member = sourceMembers[selection.memberIndex];
        if (!source || !Number.isInteger(selection.memberIndex) || !member) {
            throw new Error('A selected participant could not be found. Refresh and try again.');
        }

        const indexes = selectionsBySource.get(selection.sourceTeamId) || new Set<number>();
        indexes.add(selection.memberIndex);
        selectionsBySource.set(selection.sourceTeamId, indexes);
        movedMembers.push(member);

        const email = memberEmail(member);
        const sourceMealState = source.member_meal_state || source.raw_data?.memberMealState || {};
        if (email && sourceMealState[email]) targetMealState[email] = sourceMealState[email];
    }

    const targetMembers = [...(target.members || []), ...movedMembers];
    if (targetMembers.length > MAX_TEAM_MEMBERS) {
        throw new Error(`A team can have at most ${MAX_TEAM_MEMBERS} participants.`);
    }

    const targetCaptain = targetMembers[0];
    const targetCaptainDetails = targetCaptain && typeof targetCaptain === 'object' ? targetCaptain as Record<string, string> : {};
    const { error: targetError } = await supabase
        .from('registrations')
        .update({
            members: targetMembers,
            member_meal_state: targetMealState,
            captain: memberName(targetCaptain),
            captain_mobile: targetCaptainDetails.phone || '',
            college: targetCaptainDetails.college || ''
        })
        .eq('transaction_id', target.transaction_id);
    if (targetError) throw targetError;

    for (const [sourceId, selectedIndexes] of selectionsBySource) {
        const source = byTeamId.get(sourceId)!;
        const sourceMembers = source.members || [];
        const remaining = sourceMembers.filter((_: unknown, index: number) => !selectedIndexes.has(index));
        const mealState = { ...(source.member_meal_state || source.raw_data?.memberMealState || {}) };
        for (const index of selectedIndexes) {
            const email = memberEmail(sourceMembers[index]);
            if (email && !remaining.some((member: unknown) => memberEmail(member) === email)) delete mealState[email];
        }

        const captain = remaining[0];
        const captainDetails = captain && typeof captain === 'object' ? captain as Record<string, string> : {};
        const { error: sourceError } = await supabase
            .from('registrations')
            .update({
                members: remaining,
                member_meal_state: mealState,
                captain: memberName(captain) || 'N/A',
                captain_mobile: captainDetails.phone || '',
                college: captainDetails.college || '',
                ...(remaining.length ? {} : { status: 'MERGED' })
            })
            .eq('transaction_id', source.transaction_id);
        if (sourceError) throw sourceError;
    }

    return { success: true, movedCount: movedMembers.length };
}

export async function GET(req: Request) {
    const session = getSession(req);
    if (!hasRole(session, ['team', 'admin', 'volunteer', 'livescore'])) {
        return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }
    const portalMode = session.portalMode || await getParticipantPortalMode();
    // if (session.role === 'team' && portalMode !== 'event') {
    //     return NextResponse.json({ error: 'Team dashboard access is available only October 10–11, 2026 (IST).' }, { status: 403 });
    // }

    try {
        const requestedTeamId = new URL(req.url).searchParams.get('teamId');
        const teamId = session.role === 'team' ? session.teamId : requestedTeamId;
        if (session.role === 'team' && !teamId) {
            return NextResponse.json({ error: 'Team session is missing its team ID.' }, { status: 403 });
        }

        // --- ADDED REDIS CACHING FOR FULL TEAM LIST ---
        if (!teamId) {
            const cacheKey = session.role === 'livescore' ? 'all_teams_cache_livescore' : 'all_teams_cache_admin';

            // 1. Check L1 In-Memory Cache first (0 commands, 0 egress)
            const memoryHit = memoryCache[cacheKey];
            if (memoryHit && (Date.now() - memoryHit.timestamp) < MEMORY_CACHE_TTL) {
                return NextResponse.json(memoryHit.data, { headers: { 'Cache-Control': 'no-store' } });
            }

            // 2. Check L2 Redis Cache
            if (redis) {
                try {
                    const cachedTeams = await redis.get(cacheKey);
                    if (cachedTeams) {
                        const parsedTeams = typeof cachedTeams === 'string' ? JSON.parse(cachedTeams) : cachedTeams;
                        // Populate L1 cache for next request
                        memoryCache[cacheKey] = { data: parsedTeams, timestamp: Date.now() };
                        return NextResponse.json(parsedTeams, { headers: { 'Cache-Control': 'no-store' } });
                    }
                } catch (cacheErr) {
                    console.error("Redis cache read error:", cacheErr);
                }
            }
        }
        // ----------------------------------------------

        const pageSize = 1000;
        const teams: Record<string, unknown>[] = [];
        let from = 0;

        while (true) {
            let query = supabase
                .from('registrations')
                .select('*')
                .neq('status', 'MERGED')
                .order('created_at', { ascending: false })
                .range(from, from + pageSize - 1);
            if (teamId) query = query.eq('team_id', teamId);

            const { data, error } = await query;
            if (error) throw error;
            teams.push(...(data || []));
            if (!data || data.length < pageSize) break;
            from += pageSize;
        }

        const result = teams.map(teamResponse);
        const requestedTeamIds = result.map(team => team.teamId).filter((id): id is string => typeof id === 'string' && Boolean(id));
        const evaluations: Record<string, unknown>[] = [];
        let evaluationStorageAvailable = true;
        evaluationPages:
        for (let teamOffset = 0; teamOffset < requestedTeamIds.length; teamOffset += 500) {
            const teamIdBatch = requestedTeamIds.slice(teamOffset, teamOffset + 500);
            for (let evaluationOffset = 0; ; evaluationOffset += 1000) {
                const { data, error } = await supabase
                    .from('judging_evaluations')
                    .select('team_id, round_id, judge_id, criteria_scores, total_score, feedback, status')
                    .in('team_id', teamIdBatch)
                    .eq('status', 'submitted')
                    .range(evaluationOffset, evaluationOffset + 999);
                if (error?.code === 'PGRST205') {
                    evaluationStorageAvailable = false;
                    break evaluationPages;
                }
                if (error) throw error;
                evaluations.push(...(data || []));
                if (!data || data.length < 1000) break;
            }
        }
        if (!evaluationStorageAvailable) {
            console.warn('Judging evaluation table is not installed yet; returning legacy registration scores.');
        }

        const evaluationsByTeam = new Map<string, Record<string, unknown>[]>();
        for (const evaluation of evaluations) {
            const teamEvaluations = evaluationsByTeam.get(String(evaluation.team_id)) || [];
            teamEvaluations.push(evaluation);
            evaluationsByTeam.set(String(evaluation.team_id), teamEvaluations);
        }

        const resultWithEvaluations = result.map(team => {
            const roundScores = { ...(team.roundScores as Record<string, Record<string, number>> || {}) };
            const roundDetailedScores = { ...(team.roundDetailedScores as Record<string, Record<string, Record<string, number>>> || {}) };
            const roundComments = { ...(team.roundComments as Record<string, Record<string, string | null>> || {}) };
            for (const evaluation of evaluationsByTeam.get(String(team.teamId)) || []) {
                const roundId = String(evaluation.round_id);
                const judgeId = String(evaluation.judge_id);
                roundScores[roundId] = { ...(roundScores[roundId] || {}), [judgeId]: Number(evaluation.total_score) };
                roundDetailedScores[roundId] = {
                    ...(roundDetailedScores[roundId] || {}),
                    [judgeId]: evaluation.criteria_scores as Record<string, number> || {}
                };
                roundComments[roundId] = {
                    ...(roundComments[roundId] || {}),
                    [judgeId]: String(evaluation.feedback || '')
                };
            }
            return { ...team, roundScores, roundDetailedScores, roundComments };
        });

        let responsePayload;
        let cacheKeyToSet: string | null = null;
        
        if (session.role === 'livescore') {
            responsePayload = resultWithEvaluations.map(team => ({
                id: team.id,
                teamId: team.teamId,
                name: team.name,
                team: team.team,
                track: team.track,
                roundScores: team.roundScores,
                roundComments: team.roundComments,
                isCheckedIn: team.isCheckedIn,
                submission: team.submission
            }));
            if (!teamId) cacheKeyToSet = 'all_teams_cache_livescore';
        } else {
            responsePayload = resultWithEvaluations;
            if (!teamId) cacheKeyToSet = 'all_teams_cache_admin';
        }

        // Save to cache for 30 seconds if it was a full fetch
        if (cacheKeyToSet) {
            // Save to L1 Memory Cache
            memoryCache[cacheKeyToSet] = { data: responsePayload, timestamp: Date.now() };

            // Save to L2 Redis Cache
            if (redis) {
                try {
                    await redis.setex(cacheKeyToSet, 30, JSON.stringify(responsePayload));
                } catch (err) {
                    console.error("Failed to write to Redis cache:", err);
                }
            }
        }

        return NextResponse.json(responsePayload, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        console.error('Team fetch failed:', error);
        return NextResponse.json({ error: 'Could not fetch teams from Supabase.' }, { status: 503 });
    }
}

export async function PATCH(req: Request) {
    const session = getSession(req);
    if (!hasRole(session, ['team', 'admin', 'volunteer'])) {
        return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }
    const portalMode = session.portalMode || await getParticipantPortalMode();
    // if (session.role === 'team' && portalMode !== 'event') {
    //     return NextResponse.json({ error: 'Team dashboard access is available only October 10–11, 2026 (IST).' }, { status: 403 });
    // }

    try {
        const body = await req.json();
        const {
            id, problemStatement, proposedIdea, techStack, submission, roundScores,
            roundComments, roundDetailedScores, isCheckedIn, checkedInAt,
            members, memberMealState, memberContributions, transferMembers
        } = body;

        if (typeof id !== 'string' || !id) return NextResponse.json({ error: 'ID is required.' }, { status: 400 });
        if (session.role === 'team' && proposedIdea !== undefined &&
            (typeof proposedIdea !== 'string' || proposedIdea.length > MAX_PROPOSED_IDEA_CHARACTERS)) {
            return NextResponse.json({
                error: `Proposed idea must be ${MAX_PROPOSED_IDEA_CHARACTERS} characters or fewer.`
            }, { status: 400 });
        }
        if (roundScores !== undefined || roundComments !== undefined || roundDetailedScores !== undefined) {
            return NextResponse.json({ error: 'Evaluations must be saved through the durable judging workflow.' }, { status: 409 });
        }
        if (session.role === 'team') {
            const allowedKeys = new Set(['id', 'proposedIdea', 'techStack', 'submission', 'memberContributions']);
            if (Object.keys(body).some(key => !allowedKeys.has(key))) {
                return NextResponse.json({ error: 'Team sessions may only update their own project details.' }, { status: 403 });
            }
        }
        if (session.role === 'volunteer') {
            const allowedKeys = new Set(['id', 'isCheckedIn', 'checkedInAt', 'memberMealState']);
            if (Object.keys(body).some(key => !allowedKeys.has(key))) {
                return NextResponse.json({ error: 'Volunteer sessions may only update check-in and meal operations.' }, { status: 403 });
            }
        }
        if (transferMembers !== undefined) {
            if (!Array.isArray(transferMembers) || transferMembers.some(selection =>
                typeof selection?.sourceTeamId !== 'string' || !Number.isInteger(selection?.memberIndex)
            )) {
                return NextResponse.json({ error: 'Invalid participant transfer request.' }, { status: 400 });
            }
            return NextResponse.json(await transferTeamMembers(id, transferMembers));
        }

        const existing = await findRegistration(id);
        if (!existing) return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
        if (session.role === 'team' && existing.team_id !== session.teamId) {
            return NextResponse.json({ error: 'Team sessions may only update their own project.' }, { status: 403 });
        }

        if (session.role === 'team') {
            const existingRawData = existing.raw_data && typeof existing.raw_data === 'object'
                ? existing.raw_data as Record<string, unknown>
                : {};
            if (proposedIdea !== undefined && isEnabledFlag(existingRawData.pi_locked)) {
                return NextResponse.json({ error: 'The proposed idea has already been locked.' }, { status: 409 });
            }
            if (techStack !== undefined && isEnabledFlag(existingRawData.ts_locked)) {
                return NextResponse.json({ error: 'The tech stack has already been locked.' }, { status: 409 });
            }

            if (proposedIdea !== undefined || techStack !== undefined || submission !== undefined || memberContributions !== undefined) {
                const { data: submissionLock, error: submissionLockError } = await supabase
                    .from('hackathon_settings')
                    .select('value')
                    .eq('key', 'is_submission_locked')
                    .maybeSingle();
                if (submissionLockError) throw submissionLockError;
                if (isEnabledFlag(submissionLock?.value)) {
                    return NextResponse.json({ error: 'Team submissions are locked by the event administrators.' }, { status: 423 });
                }
            }
        }

        const updateData: Record<string, unknown> = {};
        if (members !== undefined) {
            if (!Array.isArray(members)) return NextResponse.json({ error: 'Members must be an array.' }, { status: 400 });
            if (members.length > MAX_TEAM_MEMBERS && members.length > (existing.members || []).length) {
                return NextResponse.json({ error: `Teams are limited to ${MAX_TEAM_MEMBERS} participants.` }, { status: 400 });
            }
            updateData.members = members;
        }

        const rawData = { ...(existing.raw_data || {}) };
        let rawDataChanged = false;
        if (problemStatement !== undefined) {
            updateData.problem_statement = problemStatement;
            rawData.ps_locked = true;
            rawDataChanged = true;
        }
        if (proposedIdea !== undefined) {
            updateData.proposed_idea = proposedIdea;
            rawData.pi_locked = true;
            rawDataChanged = true;
        }
        if (techStack !== undefined) {
            updateData.tech_stack = techStack;
            rawData.ts_locked = true;
            rawDataChanged = true;
        }
        if (memberContributions !== undefined) {
            const roster = Array.isArray(existing.members) ? existing.members : [];
            if (!Array.isArray(memberContributions) ||
                memberContributions.length !== roster.length ||
                memberContributions.some((contribution: unknown) =>
                    typeof contribution !== 'string' || contribution.length > 2000
                )) {
                return NextResponse.json({
                    error: 'Enter a contribution of 2,000 characters or fewer for every current team member.'
                }, { status: 400 });
            }
            rawData.member_contributions = Object.fromEntries(
                memberContributions.map((contribution: string, index: number) => [
                    memberContributionKey(roster[index], index),
                    contribution.trim(),
                ])
            );
            rawDataChanged = true;
        }
        if (checkedInAt !== undefined) {
            rawData.checkedInAt = checkedInAt;
            rawDataChanged = true;
        }
        if (rawDataChanged) updateData.raw_data = rawData;

        if (memberMealState !== undefined) updateData.member_meal_state = memberMealState;
        if (isCheckedIn !== undefined) updateData.is_checked_in = isCheckedIn;
        if (submission) {
            if (submission.github !== undefined) updateData.github_url = submission.github;
            if (submission.presentation !== undefined) updateData.presentation_url = submission.presentation;
            if (submission.demo !== undefined) updateData.demo_url = submission.demo;
            if (submission.deployment !== undefined) updateData.deployment_url = submission.deployment;
            if (submission.projectZip !== undefined) {
                if (typeof submission.projectZip !== 'string' || submission.projectZip.length > 2048) {
                    return NextResponse.json({ error: 'The Google Drive link must be a valid URL of 2048 characters or fewer.' }, { status: 400 });
                }
                if (submission.projectZip) {
                    try {
                        const projectZipUrl = new URL(submission.projectZip);
                        if (projectZipUrl.protocol !== 'https:' || projectZipUrl.hostname !== 'drive.google.com') {
                            return NextResponse.json({ error: 'Please provide an HTTPS Google Drive sharing link.' }, { status: 400 });
                        }
                    } catch {
                        return NextResponse.json({ error: 'Please provide a valid Google Drive sharing link.' }, { status: 400 });
                    }
                }
                rawData.project_zip_url = submission.projectZip;
                updateData.raw_data = rawData;
            }
            if (submission.isFinal !== undefined) updateData.is_final_submission = submission.isFinal;
        }
        if (!Object.keys(updateData).length) return NextResponse.json({ error: 'No fields to update.' }, { status: 400 });

        const { error } = await supabase
            .from('registrations')
            .update(updateData)
            .eq('transaction_id', existing.transaction_id);
        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Team update failed:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not update team in Supabase.' }, { status: 503 });
    }
}
