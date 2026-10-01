import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { MAX_TEAM_MEMBERS } from '@/lib/constants';
import { getSession, hasRole } from '@/lib/session';
import { getParticipantPortalMode } from '@/lib/event-windows';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

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

function teamResponse(row: Record<string, unknown>) {
    const rawData = row.raw_data && typeof row.raw_data === 'object'
        ? row.raw_data as Record<string, unknown>
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
        members: row.members || [],
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
            isFinal: row.is_final_submission || false
        },
        roundScores: row.round_scores || {},
        roundDetailedScores: row.round_detailed_scores || {},
        roundComments: row.round_comments || {},
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
    if (session.role === 'team' && portalMode !== 'event') {
        return NextResponse.json({ error: 'Team dashboard access is available only October 10–11, 2026 (IST).' }, { status: 403 });
    }

    try {
        const requestedTeamId = new URL(req.url).searchParams.get('teamId');
        const teamId = session.role === 'team' ? session.teamId : requestedTeamId;
        if (session.role === 'team' && !teamId) {
            return NextResponse.json({ error: 'Team session is missing its team ID.' }, { status: 403 });
        }

        // --- ADDED REDIS CACHING FOR FULL TEAM LIST ---
        if (!teamId && redis) {
            try {
                // Determine cache key based on role (livescore needs a stripped down payload)
                const cacheKey = session.role === 'livescore' ? 'all_teams_cache_livescore' : 'all_teams_cache_admin';
                const cachedTeams = await redis.get(cacheKey);
                if (cachedTeams) {
                    const parsedTeams = typeof cachedTeams === 'string' ? JSON.parse(cachedTeams) : cachedTeams;
                    return NextResponse.json(parsedTeams, { headers: { 'Cache-Control': 'no-store' } });
                }
            } catch (cacheErr) {
                console.error("Redis cache read error:", cacheErr);
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
        if (cacheKeyToSet && redis) {
            try {
                await redis.setex(cacheKeyToSet, 30, JSON.stringify(responsePayload));
            } catch (err) {
                console.error("Failed to write to Redis cache:", err);
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
    if (session.role === 'team' && portalMode !== 'event') {
        return NextResponse.json({ error: 'Team dashboard access is available only October 10–11, 2026 (IST).' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const {
            id, problemStatement, proposedIdea, techStack, submission, roundScores,
            roundComments, roundDetailedScores, isCheckedIn, checkedInAt,
            members, memberMealState, transferMembers
        } = body;

        if (typeof id !== 'string' || !id) return NextResponse.json({ error: 'ID is required.' }, { status: 400 });
        if (roundScores !== undefined || roundComments !== undefined || roundDetailedScores !== undefined) {
            return NextResponse.json({ error: 'Evaluations must be saved through the durable judging workflow.' }, { status: 409 });
        }
        if (session.role === 'team') {
            const allowedKeys = new Set(['id', 'proposedIdea', 'techStack', 'submission']);
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

            if (proposedIdea !== undefined || techStack !== undefined || submission !== undefined) {
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
