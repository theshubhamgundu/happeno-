import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession, hasRole } from '@/lib/session';
import { getRoundStartTime, normalizeJudgingRounds, type JudgingRound } from '@/lib/judging-rounds';

export const dynamic = 'force-dynamic';

const CLAIM_DURATION_MS = 30 * 60 * 1000;
const evaluationFields = 'id, team_id, round_id, round_title, judge_id, judge_name, criteria_scores, total_score, feedback, status, claim_expires_at, submitted_at';

function jsonError(error: string, status: number) {
    return NextResponse.json({ success: false, error }, {
        status,
        headers: { 'Cache-Control': 'no-store, private', 'Pragma': 'no-cache' }
    });
}

function isFlagEnabled(value: unknown): boolean {
    return value === true || (typeof value === 'string' && value.toLowerCase() === 'true');
}

async function loadSettings() {
    const { data, error } = await supabase
        .from('hackathon_settings')
        .select('key, value')
        .in('key', ['round_configs', 'start_date', 'is_round_lock_enabled', 'event_access_start', 'event_access_end']);
    if (error) throw error;
    return new Map((data || []).map(row => [row.key, row.value]));
}

function evaluationResponse(evaluation: Record<string, unknown>, team: Record<string, unknown>, round: JudgingRound) {
    return NextResponse.json({
        success: true,
        evaluation: {
            id: evaluation.id,
            status: evaluation.status,
            criteriaScores: evaluation.criteria_scores || {},
            feedback: evaluation.feedback || '',
            claimExpiresAt: evaluation.claim_expires_at
        },
        round,
        team: {
            teamId: team.team_id,
            teamName: team.team_name,
            captain: team.captain || '',
            track: team.track || '',
            problemStatement: team.problem_statement || '',
            proposedIdea: team.proposed_idea || '',
            techStack: team.tech_stack || {},
            members: team.members || [],
            isFinalSubmission: Boolean(team.is_final_submission),
            submission: {
                github: team.github_url || '',
                presentation: team.presentation_url || '',
                demo: team.demo_url || '',
                deployment: team.deployment_url || ''
            }
        }
    }, { headers: { 'Cache-Control': 'no-store, private', 'Pragma': 'no-cache' } });
}

export async function POST(req: Request) {
    const session = getSession(req);
    if (!hasRole(session, ['judge']) || !session.id) return jsonError('Judge authentication required.', 401);

    try {
        const body = await req.json() as { teamId?: unknown };
        const teamId = typeof body.teamId === 'string' ? body.teamId.trim().toUpperCase() : '';
        if (!teamId) return jsonError('Enter a team ID.', 400);

        const [{ data: team, error: teamError }, settings] = await Promise.all([
            supabase
                .from('registrations')
                .select('transaction_id, team_id, team_name, captain, track, problem_statement, proposed_idea, tech_stack, members, github_url, presentation_url, demo_url, deployment_url, is_final_submission, status')
                .eq('team_id', teamId)
                .maybeSingle(),
            loadSettings()
        ]);
        if (teamError) throw teamError;
        if (!team) return jsonError('No team was found with that ID.', 404);
        if (['PENDING', 'REJECTED', 'MERGED'].includes(String(team.status).toUpperCase())) {
            return jsonError('This team is not eligible for judging.', 409);
        }

        const rounds = normalizeJudgingRounds(settings.get('round_configs'));
        if (!rounds.length) return jsonError('No judging rounds are configured.', 503);
        const eventStart = Date.parse(String(settings.get('event_access_start') || ''));
        const eventEnd = Date.parse(String(settings.get('event_access_end') || ''));
        if (!Number.isFinite(eventStart) || !Number.isFinite(eventEnd) || Date.now() < eventStart || Date.now() >= eventEnd) {
            return jsonError('Judging is available only during the configured hackathon event window.', 403);
        }
        const { data: existingRows, error: existingError } = await supabase
            .from('judging_evaluations')
            .select(evaluationFields)
            .eq('team_id', teamId);
        if (existingError) throw existingError;

        const now = new Date();
        const nowIso = now.toISOString();
        const settingsStartDate = settings.get('start_date');
        const startDate = typeof settingsStartDate === 'string' ? settingsStartDate : '2026-10-10';
        const roundLockEnabled = settings.has('is_round_lock_enabled')
            ? isFlagEnabled(settings.get('is_round_lock_enabled'))
            : true;
        const existingByRound = new Map((existingRows || []).map(row => [row.round_id, row]));

        for (const round of rounds) {
            const existing = existingByRound.get(round.id);
            if (existing?.status === 'submitted') continue;

            if (roundLockEnabled) {
                const roundStartTime = getRoundStartTime(startDate, round);
                if (!roundStartTime || now < roundStartTime) {
                    return jsonError(`${round.title} has not opened yet.`, 423);
                }
            }

            if (existing?.status === 'in_progress') {
                const expiresAt = Date.parse(String(existing.claim_expires_at || ''));
                if (existing.judge_id === session.id) {
                    if (expiresAt > now.getTime()) return evaluationResponse(existing, team, round);

                    const { data: resumed, error: resumeError } = await supabase
                        .from('judging_evaluations')
                        .update({ claim_expires_at: new Date(now.getTime() + CLAIM_DURATION_MS).toISOString() })
                        .eq('id', existing.id)
                        .eq('judge_id', session.id)
                        .eq('status', 'in_progress')
                        .lt('claim_expires_at', nowIso)
                        .select(evaluationFields)
                        .maybeSingle();
                    if (resumeError) throw resumeError;
                    if (resumed) return evaluationResponse(resumed, team, round);
                    return jsonError('This evaluation claim changed. Search again before continuing.', 409);
                }
                if (expiresAt > now.getTime()) {
                    return jsonError('Another judge is currently evaluating this team for this round.', 409);
                }
            }

            const { data: previousEvaluation, error: previousError } = await supabase
                .from('judging_evaluations')
                .select('id, round_id, status')
                .eq('team_id', teamId)
                .eq('judge_id', session.id)
                .maybeSingle();
            if (previousError) throw previousError;
            if (previousEvaluation && previousEvaluation.round_id !== round.id) {
                return jsonError('A different judge must evaluate this team in each round.', 409);
            }

            const claimExpiresAt = new Date(now.getTime() + CLAIM_DURATION_MS).toISOString();
            if (existing) {
                const { data: reclaimed, error: reclaimError } = await supabase
                    .from('judging_evaluations')
                    .update({
                        judge_id: session.id,
                        judge_name: session.name || session.id,
                        criteria_scores: {},
                        total_score: null,
                        feedback: '',
                        status: 'in_progress',
                        claim_expires_at: claimExpiresAt,
                        started_at: nowIso,
                        draft_updated_at: nowIso,
                        submitted_at: null
                    })
                    .eq('id', existing.id)
                    .eq('status', 'in_progress')
                    .lt('claim_expires_at', nowIso)
                    .select(evaluationFields)
                    .maybeSingle();
                if (reclaimError?.code === '23505') {
                    return jsonError('A different judge must evaluate this team in each round.', 409);
                }
                if (reclaimError) throw reclaimError;
                if (reclaimed) return evaluationResponse(reclaimed, team, round);
                return jsonError('This evaluation was claimed by another judge. Search again before starting.', 409);
            }

            const { data: claim, error: claimError } = await supabase
                .from('judging_evaluations')
                .insert({
                    team_id: teamId,
                    round_id: round.id,
                    round_title: round.title,
                    judge_id: session.id,
                    judge_name: session.name || session.id,
                    status: 'in_progress',
                    claim_expires_at: claimExpiresAt
                })
                .select(evaluationFields)
                .single();
            if (claimError?.code === '23505') {
                return jsonError('Another judge has already claimed this team for the round.', 409);
            }
            if (claimError) throw claimError;
            return evaluationResponse(claim, team, round);
        }

        return jsonError('All configured rounds for this team have been submitted.', 409);
    } catch (error: unknown) {
        console.error('Judge evaluation claim failed:', error);
        return jsonError('Could not start this evaluation. Confirm the judging database migration has been applied.', 503);
    }
}

export async function PATCH(req: Request) {
    const session = getSession(req);
    if (!hasRole(session, ['judge']) || !session.id) return jsonError('Judge authentication required.', 401);

    try {
        const body = await req.json() as {
            evaluationId?: unknown;
            criteriaScores?: unknown;
            feedback?: unknown;
        };
        if (typeof body.evaluationId !== 'string' || !body.evaluationId) return jsonError('Evaluation ID is required.', 400);
        if (!body.criteriaScores || typeof body.criteriaScores !== 'object' || Array.isArray(body.criteriaScores)) {
            return jsonError('Draft scores must be an object.', 400);
        }
        if (typeof body.feedback !== 'string') return jsonError('Feedback must be text.', 400);

        const { data: evaluation, error: evaluationError } = await supabase
            .from('judging_evaluations')
            .select('id, round_id, judge_id, status, claim_expires_at')
            .eq('id', body.evaluationId)
            .maybeSingle();
        if (evaluationError) throw evaluationError;
        if (!evaluation || evaluation.judge_id !== session.id) return jsonError('This evaluation is not claimed by your judge account.', 403);
        if (evaluation.status !== 'in_progress' || Date.parse(evaluation.claim_expires_at) <= Date.now()) {
            return jsonError('This evaluation claim expired. Start the team evaluation again.', 409);
        }

        const settings = await loadSettings();
        const round = normalizeJudgingRounds(settings.get('round_configs')).find(item => item.id === evaluation.round_id);
        if (!round) return jsonError('This judging round is no longer configured.', 409);
        const scores = body.criteriaScores as Record<string, unknown>;
        const validCriterionIds = new Set(round.criteria.map(criterion => criterion.id));
        if (Object.keys(scores).some(id => !validCriterionIds.has(id) || typeof scores[id] !== 'number' || !Number.isFinite(scores[id]) || Number(scores[id]) < 1 || Number(scores[id]) > 10)) {
            return jsonError('Draft contains an invalid score.', 400);
        }

        const now = new Date();
        const { data: saved, error: saveError } = await supabase
            .from('judging_evaluations')
            .update({
                criteria_scores: scores,
                feedback: body.feedback,
                claim_expires_at: new Date(now.getTime() + CLAIM_DURATION_MS).toISOString(),
                draft_updated_at: now.toISOString()
            })
            .eq('id', evaluation.id)
            .eq('judge_id', session.id)
            .eq('status', 'in_progress')
            .select('id')
            .maybeSingle();
        if (saveError) throw saveError;
        if (!saved) return jsonError('This evaluation claim changed; reload before continuing.', 409);
        return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store, private' } });
    } catch (error: unknown) {
        console.error('Judge evaluation draft save failed:', error);
        return jsonError('Could not save evaluation draft.', 503);
    }
}

export async function PUT(req: Request) {
    const session = getSession(req);
    if (!hasRole(session, ['judge']) || !session.id) return jsonError('Judge authentication required.', 401);

    try {
        const body = await req.json() as { evaluationId?: unknown; criteriaScores?: unknown; feedback?: unknown };
        if (typeof body.evaluationId !== 'string' || !body.evaluationId) return jsonError('Evaluation ID is required.', 400);

        const { data: evaluation, error: evaluationError } = await supabase
            .from('judging_evaluations')
            .select('id, team_id, round_id, round_title, judge_id, criteria_scores, feedback, status, claim_expires_at')
            .eq('id', body.evaluationId)
            .maybeSingle();
        if (evaluationError) throw evaluationError;
        if (!evaluation || evaluation.judge_id !== session.id) return jsonError('This evaluation is not claimed by your judge account.', 403);
        if (evaluation.status === 'submitted') {
            return NextResponse.json({ success: true, alreadySubmitted: true }, { headers: { 'Cache-Control': 'no-store, private' } });
        }
        if (Date.parse(evaluation.claim_expires_at) <= Date.now()) return jsonError('This evaluation claim expired. Start the team evaluation again.', 409);

        const settings = await loadSettings();
        const round = normalizeJudgingRounds(settings.get('round_configs')).find(item => item.id === evaluation.round_id);
        if (!round) return jsonError('This judging round is no longer configured.', 409);
        const storedScores = evaluation.criteria_scores && typeof evaluation.criteria_scores === 'object'
            ? evaluation.criteria_scores as Record<string, unknown>
            : {};
        const scores = body.criteriaScores && typeof body.criteriaScores === 'object' && !Array.isArray(body.criteriaScores)
            ? body.criteriaScores as Record<string, unknown>
            : storedScores;
        const feedback = typeof body.feedback === 'string' ? body.feedback : String(evaluation.feedback || '');
        const validCriterionIds = new Set(round.criteria.map(criterion => criterion.id));
        if (Object.keys(scores).some(id => !validCriterionIds.has(id))) {
            return jsonError('Evaluation contains an unknown scoring criterion.', 400);
        }
        const allScoresPresent = round.criteria.every(criterion =>
            typeof scores[criterion.id] === 'number' && Number(scores[criterion.id]) >= 1 && Number(scores[criterion.id]) <= 10
        );
        if (!allScoresPresent || !feedback.trim()) {
            return jsonError('Score every criterion from 1 to 10 and add feedback before submitting.', 400);
        }

        const totalScore = round.criteria.reduce((total, criterion) => total + Number(scores[criterion.id]), 0);
        const now = new Date().toISOString();
        const { data: submitted, error: submitError } = await supabase
            .from('judging_evaluations')
            .update({
                criteria_scores: scores,
                feedback,
                draft_updated_at: now,
                status: 'submitted',
                total_score: totalScore,
                submitted_at: now,
                claim_expires_at: now
            })
            .eq('id', evaluation.id)
            .eq('judge_id', session.id)
            .eq('status', 'in_progress')
            .gt('claim_expires_at', now)
            .select('id')
            .maybeSingle();
        if (submitError) throw submitError;
        if (!submitted) return jsonError('The evaluation could not be finalized. Refresh to check its saved status.', 409);

        return NextResponse.json({ success: true, totalScore }, { headers: { 'Cache-Control': 'no-store, private' } });
    } catch (error: unknown) {
        console.error('Judge evaluation submit failed:', error);
        return jsonError('Could not submit evaluation. Your saved draft remains available.', 503);
    }
}