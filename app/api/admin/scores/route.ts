import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession, hasRole } from '@/lib/session';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const session = getSession(req);
    if (!hasRole(session, ['admin'])) {
        return NextResponse.json({ success: false, error: 'Administrator access required.' }, { status: 403 });
    }

    try {
        const body = await req.json() as {
            teamId?: string;
            roundId?: string; // 'round1' | 'round2' | 'rabbit_race'
            score?: number | null; // e.g. 0-100 percentage or null to clear
            feedback?: string;
        };

        const teamId = typeof body.teamId === 'string' ? body.teamId.trim() : '';
        const roundId = typeof body.roundId === 'string' ? body.roundId.trim().toLowerCase() : '';
        const score = body.score === null || body.score === undefined ? null : Number(body.score);
        const feedback = typeof body.feedback === 'string' ? body.feedback.trim() : 'Updated by Administrator';

        if (!teamId) {
            return NextResponse.json({ success: false, error: 'Team ID is required.' }, { status: 400 });
        }
        if (!['round1', 'round2', 'rabbit_race'].includes(roundId)) {
            return NextResponse.json({ success: false, error: 'Valid roundId is required (round1, round2, rabbit_race).' }, { status: 400 });
        }
        const maxLimit = roundId === 'rabbit_race' ? 100 : 200;
        if (score !== null && (!Number.isFinite(score) || score < 0 || score > maxLimit)) {
            return NextResponse.json({ success: false, error: `Score must be a number between 0 and ${maxLimit}.` }, { status: 400 });
        }

        // 1. Fetch team
        const { data: team, error: teamErr } = await supabase
            .from('registrations')
            .select('*')
            .or(`team_id.eq.${teamId},transaction_id.eq.${teamId}`)
            .maybeSingle();

        if (teamErr) throw teamErr;
        if (!team) {
            return NextResponse.json({ success: false, error: 'Team not found.' }, { status: 404 });
        }

        const exactTeamId = team.team_id || teamId;
        const rawData = { ...(team.raw_data || {}) };

        if (roundId === 'rabbit_race') {
            rawData.rabbit_race_score = score === null ? 0 : score;
            const { error: updateErr } = await supabase
                .from('registrations')
                .update({ raw_data: rawData })
                .eq('transaction_id', team.transaction_id);

            if (updateErr) throw updateErr;
        } else {
            // Round 1 or Round 2
            const currentRoundScores = (team.round_scores && typeof team.round_scores === 'object')
                ? { ...(team.round_scores as Record<string, any>) }
                : {};
            const currentDetailedScores = (team.round_detailed_scores && typeof team.round_detailed_scores === 'object')
                ? { ...(team.round_detailed_scores as Record<string, any>) }
                : {};
            const currentComments = (team.round_comments && typeof team.round_comments === 'object')
                ? { ...(team.round_comments as Record<string, any>) }
                : {};

            if (score === null) {
                // Delete score
                delete currentRoundScores[roundId];
                delete currentDetailedScores[roundId];
                delete currentComments[roundId];

                // Also delete from judging_evaluations
                await supabase
                    .from('judging_evaluations')
                    .delete()
                    .eq('team_id', exactTeamId)
                    .eq('round_id', roundId);
            } else {
                // Total score is directly out of 200 for rounds
                const totalScore = Number(score.toFixed(1));
                const judgeId = 'admin';

                const roundJudgeScores = (typeof currentRoundScores[roundId] === 'object' && currentRoundScores[roundId] !== null)
                    ? { ...currentRoundScores[roundId] }
                    : {};
                roundJudgeScores[judgeId] = totalScore;
                currentRoundScores[roundId] = roundJudgeScores;

                const roundJudgeComments = (typeof currentComments[roundId] === 'object' && currentComments[roundId] !== null)
                    ? { ...currentComments[roundId] }
                    : {};
                roundJudgeComments[judgeId] = feedback;
                currentComments[roundId] = roundJudgeComments;

                // Sync to judging_evaluations
                const { data: existingEval } = await supabase
                    .from('judging_evaluations')
                    .select('id')
                    .eq('team_id', exactTeamId)
                    .eq('round_id', roundId)
                    .maybeSingle();

                const now = new Date().toISOString();
                const evalPayload = {
                    team_id: exactTeamId,
                    round_id: roundId,
                    round_title: roundId === 'round1' ? 'Round-1' : 'Round-2',
                    judge_id: judgeId,
                    judge_name: 'Administrator',
                    total_score: totalScore,
                    feedback,
                    status: 'submitted',
                    submitted_at: now,
                    claim_expires_at: now
                };

                if (existingEval) {
                    await supabase
                        .from('judging_evaluations')
                        .update(evalPayload)
                        .eq('id', existingEval.id);
                } else {
                    await supabase
                        .from('judging_evaluations')
                        .insert(evalPayload);
                }
            }

            const { error: updateErr } = await supabase
                .from('registrations')
                .update({
                    round_scores: currentRoundScores,
                    round_detailed_scores: currentDetailedScores,
                    round_comments: currentComments
                })
                .eq('transaction_id', team.transaction_id);

            if (updateErr) throw updateErr;
        }

        // Clear redis caches
        if (redis) {
            try {
                await Promise.allSettled([
                    redis.del('all_teams_cache_admin'),
                    redis.del('all_teams_cache_livescore')
                ]);
            } catch (cacheErr) {
                console.warn('Redis cache clear error:', cacheErr);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Score for ${roundId.toUpperCase()} updated successfully.`
        });
    } catch (err: any) {
        console.error('Failed to update score:', err);
        return NextResponse.json({ success: false, error: err?.message || 'Server error updating score' }, { status: 500 });
    }
}
