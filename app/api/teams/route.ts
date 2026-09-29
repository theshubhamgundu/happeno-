import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { MAX_TEAM_MEMBERS } from '@/lib/constants';
import { getSession, hasRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

function hasValidCriterionScores(value: unknown): boolean {
    if (typeof value === 'number') return Number.isFinite(value) && value >= 1 && value <= 10;
    if (Array.isArray(value)) return value.every(hasValidCriterionScores);
    if (value && typeof value === 'object') {
        return Object.values(value as Record<string, unknown>).every(hasValidCriterionScores);
    }
    return false;
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

function teamResponse(row: Record<string, any>) {
    const rawData = row.raw_data || {};
    return {
        id: row.transaction_id || '',
        name: row.team_name || 'Unknown Team',
        team: row.team_name || 'Unknown Team',
        track: row.track || '',
        captain: row.captain || 'N/A',
        captainMobile: row.captain_mobile || '',
        college: row.college || '',
        teamId: row.team_id || '',
        members: row.members || [],
        status: row.status || 'PENDING',
        problemStatement: row.problem_statement || '',
        proposedIdea: row.proposed_idea || '',
        techStack: row.tech_stack || {},
        isPSLocked: rawData.ps_locked || false,
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

    const { data: rows, error } = await supabase
        .from('registrations')
        .select('transaction_id, team_id, team_name, members, member_meal_state, raw_data, captain, captain_mobile, college')
        .in('team_id', [...sourceIds, targetId]);
    if (error) throw error;

    const byTeamId = new Map((rows || []).map(row => [row.team_id, row]));
    const target = byTeamId.get(targetId);
    if (!target) throw new Error('The destination team could not be found. Refresh and try again.');

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
    if (!hasRole(session, ['team', 'admin', 'judge', 'volunteer', 'livescore'])) {
        return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    try {
        const requestedTeamId = new URL(req.url).searchParams.get('teamId');
        const teamId = session.role === 'team' ? session.teamId : requestedTeamId;
        if (session.role === 'team' && !teamId) {
            return NextResponse.json({ error: 'Team session is missing its team ID.' }, { status: 403 });
        }
        const pageSize = 1000;
        const teams: Record<string, any>[] = [];
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
        if (session.role === 'livescore') {
            return NextResponse.json(result.map(team => ({
                id: team.id,
                teamId: team.teamId,
                name: team.name,
                team: team.team,
                track: team.track,
                roundScores: team.roundScores,
                roundComments: team.roundComments,
                isCheckedIn: team.isCheckedIn,
                submission: team.submission
            })), { headers: { 'Cache-Control': 'no-store' } });
        }
        return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        console.error('Team fetch failed:', error);
        return NextResponse.json({ error: 'Could not fetch teams from Supabase.' }, { status: 503 });
    }
}

export async function PATCH(req: Request) {
    const session = getSession(req);
    if (!hasRole(session, ['team', 'admin', 'judge', 'volunteer'])) {
        return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            id, problemStatement, proposedIdea, techStack, submission, roundScores,
            roundComments, roundDetailedScores, isCheckedIn, checkedInAt,
            members, memberMealState, transferMembers
        } = body;

        if (typeof id !== 'string' || !id) return NextResponse.json({ error: 'ID is required.' }, { status: 400 });
        if (session.role === 'team') {
            const allowedKeys = new Set(['id', 'problemStatement', 'proposedIdea', 'techStack', 'submission']);
            if (Object.keys(body).some(key => !allowedKeys.has(key))) {
                return NextResponse.json({ error: 'Team sessions may only update their own project details.' }, { status: 403 });
            }
        }
        if (session.role === 'judge') {
            const allowedKeys = new Set(['id', 'roundScores', 'roundComments', 'roundDetailedScores']);
            if (Object.keys(body).some(key => !allowedKeys.has(key))) {
                return NextResponse.json({ error: 'Judge sessions may only update evaluation data.' }, { status: 403 });
            }
        }
        if (session.role === 'volunteer') {
            const allowedKeys = new Set(['id', 'isCheckedIn', 'checkedInAt', 'memberMealState', 'members', 'transferMembers']);
            if (Object.keys(body).some(key => !allowedKeys.has(key))) {
                return NextResponse.json({ error: 'Volunteer sessions may only update check-in and meal operations.' }, { status: 403 });
            }
        }
        if (roundDetailedScores !== undefined && !hasValidCriterionScores(roundDetailedScores)) {
            return NextResponse.json({ error: 'Criterion scores must be between 1 and 10.' }, { status: 400 });
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

        const updateData: Record<string, any> = {};
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
        if (roundScores !== undefined) updateData.round_scores = roundScores;
        if (roundComments !== undefined) updateData.round_comments = roundComments;
        if (roundDetailedScores !== undefined) updateData.round_detailed_scores = roundDetailedScores;
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
