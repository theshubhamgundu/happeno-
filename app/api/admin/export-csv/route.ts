import { NextResponse } from 'next/server';
import { getSession, hasRole } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import { EVENT_MEALS } from '@/lib/meals';

export const dynamic = 'force-dynamic';

function escapeCsv(val: unknown): string {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    return `"${str.replace(/"/g, '""')}"`;
}

function extractScore(val: unknown): number {
    if (typeof val === 'number' && Number.isFinite(val)) return val;
    if (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val))) return Number(val);
    if (val && typeof val === 'object') {
        const numbers = Object.values(val as Record<string, unknown>)
            .map(v => typeof v === 'number' ? v : Number(v))
            .filter(n => Number.isFinite(n));
        if (numbers.length > 0) {
            return Number((numbers.reduce((a, b) => a + b, 0) / numbers.length).toFixed(1));
        }
    }
    return 0;
}

function getTeamRoundScore(roundScores: Record<string, any>, roundIdVariants: string[], evalsScore?: number): number {
    for (const key of roundIdVariants) {
        if (roundScores[key] !== undefined) {
            const parsed = extractScore(roundScores[key]);
            if (parsed > 0) return parsed;
        }
    }
    if (typeof evalsScore === 'number' && Number.isFinite(evalsScore) && evalsScore > 0) {
        return evalsScore;
    }
    return 0;
}

async function fetchAllRegistrations(): Promise<Record<string, any>[]> {
    const records: Record<string, any>[] = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
        const { data, error } = await supabase
            .from('registrations')
            .select('*')
            .range(from, from + pageSize - 1);
        if (error) throw error;
        if (data) records.push(...data);
        if (!data || data.length < pageSize) break;
        from += pageSize;
    }
    return records;
}

// GET: Export data as CSV
export async function GET(req: Request) {
    const session = getSession(req);
    if (!hasRole(session, ['admin'])) {
        return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const validTypes = ['teams', 'standings', 'submissions', 'meals', 'checkin', 'emails', 'dietary', 'judges', 'volunteers', 'master', 'contributions'];

    if (!type || !validTypes.includes(type)) {
        return NextResponse.json({
            error: `Valid export type is required: ${validTypes.join(', ')}`
        }, { status: 400 });
    }

    try {
        let csvContent = '';
        const todayStr = new Date().toISOString().split('T')[0];

        // ═════════════════════════════════════════════════════════
        // 1. ALL TEAMS EXPORT
        // ═════════════════════════════════════════════════════════
        if (type === 'teams') {
            const teams = await fetchAllRegistrations();
            csvContent = 'Team ID,Transaction ID,Team Name,Track,Captain,Captain Email,Captain Phone,College,Members Count,Registration Status,Check-In Status,Problem Statement,Created At\n';
            for (const team of teams) {
                const raw = (team.raw_data as Record<string, any>) || {};
                const members = Array.isArray(team.members) && team.members.length > 0 ? team.members : ((raw.members as unknown[]) || []);
                const captain = (members[0] as Record<string, string>) || {};

                csvContent += [
                    escapeCsv(team.team_id || ''),
                    escapeCsv(team.transaction_id || ''),
                    escapeCsv(team.team_name || raw.teamName || ''),
                    escapeCsv(team.track || ''),
                    escapeCsv(team.captain || captain.fullName || ''),
                    escapeCsv(team.email || captain.email || ''),
                    escapeCsv(team.captain_mobile || captain.phone || ''),
                    escapeCsv(team.college || raw.college || ''),
                    members.length,
                    escapeCsv(team.status || 'PENDING'),
                    escapeCsv(team.is_checked_in ? 'Checked In' : 'Pending'),
                    escapeCsv(team.problem_statement || ''),
                    escapeCsv(team.created_at ? new Date(team.created_at).toLocaleString() : '')
                ].join(',') + '\n';
            }
        }

        // ═════════════════════════════════════════════════════════
        // 2. FINAL SCORES & STANDINGS (CLOSING CEREMONY)
        // ═════════════════════════════════════════════════════════
        else if (type === 'standings') {
            const teams = await fetchAllRegistrations();

            // Fetch judging evaluations if available
            const { data: evaluations } = await supabase
                .from('judging_evaluations')
                .select('team_id, round_id, total_score, feedback, judge_name')
                .eq('status', 'submitted');

            const evalMap = new Map<string, { roundScores: Map<string, number[]>; feedback: string[] }>();
            (evaluations || []).forEach(ev => {
                let existing = evalMap.get(ev.team_id);
                if (!existing) {
                    existing = { roundScores: new Map(), feedback: [] };
                    evalMap.set(ev.team_id, existing);
                }
                const score = Number(ev.total_score);
                if (Number.isFinite(score)) {
                    const roundId = String(ev.round_id || '').toLowerCase();
                    const cur = existing.roundScores.get(roundId) || [];
                    cur.push(score);
                    existing.roundScores.set(roundId, cur);
                }
                if (ev.feedback) existing.feedback.push(`[${ev.judge_name || 'Judge'}]: ${ev.feedback}`);
            });

            const scoredTeams = teams.map(team => {
                const teamId = team.team_id || '';
                const roundScores = (team.round_scores as Record<string, any>) || {};
                const evals = evalMap.get(teamId);

                const r1Evals = evals ? (evals.roundScores.get('round1') || evals.roundScores.get('r1') || evals.roundScores.get('round-1') || evals.roundScores.get('round_1')) : undefined;
                const r1EvalScore = r1Evals && r1Evals.length > 0 ? Number((r1Evals.reduce((a, b) => a + b, 0) / r1Evals.length).toFixed(1)) : 0;

                const r2Evals = evals ? (evals.roundScores.get('round2') || evals.roundScores.get('r2') || evals.roundScores.get('round-2') || evals.roundScores.get('round_2')) : undefined;
                const r2EvalScore = r2Evals && r2Evals.length > 0 ? Number((r2Evals.reduce((a, b) => a + b, 0) / r2Evals.length).toFixed(1)) : 0;

                const r1 = getTeamRoundScore(roundScores, ['round1', 'r1', 'round-1', 'round_1'], r1EvalScore);
                const r2 = getTeamRoundScore(roundScores, ['round2', 'r2', 'round-2', 'round_2'], r2EvalScore);
                const totalScore = Number((r1 + r2).toFixed(1));

                const commentsObj = (team.round_comments as Record<string, any>) || {};
                const dbComments = Object.entries(commentsObj).map(([r, c]) => {
                    if (typeof c === 'object' && c !== null) {
                        return Object.entries(c).map(([j, txt]) => `${r} (${j}): ${txt}`).join(' | ');
                    }
                    return `${r}: ${c}`;
                }).join(' | ');
                const judgeComments = (evals?.feedback || []).join(' | ');
                const allComments = [dbComments, judgeComments].filter(Boolean).join(' | ');

                return {
                    teamId,
                    teamName: team.team_name || team.raw_data?.teamName || '',
                    track: team.track || '',
                    problemStatement: team.problem_statement || '',
                    round1: r1,
                    round2: r2,
                    totalScore,
                    status: team.is_eliminated ? 'Eliminated' : 'Active / Finalist',
                    comments: allComments
                };
            });

            // Sort descending by total score
            scoredTeams.sort((a, b) => b.totalScore - a.totalScore);

            csvContent = 'Rank,Team ID,Team Name,Track,Problem Statement,Round 1 Score,Round 2 Score,Total Score,Status,Judge Comments\n';
            scoredTeams.forEach((team, index) => {
                csvContent += [
                    index + 1,
                    escapeCsv(team.teamId),
                    escapeCsv(team.teamName),
                    escapeCsv(team.track),
                    escapeCsv(team.problemStatement),
                    team.round1,
                    team.round2,
                    team.totalScore,
                    escapeCsv(team.status),
                    escapeCsv(team.comments)
                ].join(',') + '\n';
            });
        }

        // ═════════════════════════════════════════════════════════
        // 3. PROJECT DELIVERABLES & SUBMISSIONS
        // ═════════════════════════════════════════════════════════
        else if (type === 'submissions') {
            const teams = await fetchAllRegistrations();
            csvContent = 'Team ID,Team Name,Track,Problem Statement,Captain,Captain Email,GitHub Repository,Presentation Slides,Demo Video,Live Deployment,Final Submission Confirmed\n';
            for (const team of teams) {
                const raw = (team.raw_data as Record<string, any>) || {};
                const sub = (raw.submission as Record<string, any>) || {};

                const github = team.github_url || sub.github || sub.repo || '';
                const presentation = team.presentation_url || sub.presentation || '';
                const demo = team.demo_url || sub.demo || sub.video || '';
                const deployment = team.deployment_url || sub.deployment || '';
                const isFinal = Boolean(team.is_final_submission || sub.isFinal);

                csvContent += [
                    escapeCsv(team.team_id || ''),
                    escapeCsv(team.team_name || raw.teamName || ''),
                    escapeCsv(team.track || ''),
                    escapeCsv(team.problem_statement || ''),
                    escapeCsv(team.captain || ''),
                    escapeCsv(team.email || ''),
                    escapeCsv(github),
                    escapeCsv(presentation),
                    escapeCsv(demo),
                    escapeCsv(deployment),
                    escapeCsv(isFinal ? 'Yes' : 'No')
                ].join(',') + '\n';
            }
        }

        // ═════════════════════════════════════════════════════════
        // 3.5. TEAM CONTRIBUTIONS
        // ═════════════════════════════════════════════════════════
        else if (type === 'contributions') {
            const teams = await fetchAllRegistrations();
            csvContent = 'Team ID,Team Name,Track,Member Name,Role,Contribution\n';
            for (const team of teams) {
                const raw = (team.raw_data as Record<string, any>) || {};
                const members = Array.isArray(team.members) && team.members.length > 0 ? team.members : ((raw.members as any[]) || []);
                const savedContributions = raw.member_contributions || {};

                members.forEach((member: any, index: number) => {
                    const memberName = member.fullName || member.name || (index === 0 ? team.captain : `Member ${index + 1}`);
                    let memberKey = `member:${String(memberName).trim().toLowerCase()}:${index}`;
                    if (member.email) {
                        memberKey = `email:${String(member.email).trim().toLowerCase()}`;
                    }
                    const contribution = savedContributions[memberKey] || '';
                    if (contribution) {
                        csvContent += [
                            escapeCsv(team.team_id || ''),
                            escapeCsv(team.team_name || raw.teamName || ''),
                            escapeCsv(team.track || ''),
                            escapeCsv(memberName),
                            escapeCsv(index === 0 ? 'Captain' : 'Member'),
                            escapeCsv(contribution)
                        ].join(',') + '\n';
                    }
                });
            }
        }

        // ═════════════════════════════════════════════════════════
        // 4. MEAL CLAIMS & CATERING AUDIT
        // ═════════════════════════════════════════════════════════
        else if (type === 'meals') {
            const teams = await fetchAllRegistrations();
            csvContent = 'Team ID,Team Name,Member Name,Member Email/Key,Role,Day 1 Breakfast,Day 1 Lunch,Day 1 Snacks,Day 1 Dinner,Day 2 Breakfast,Day 2 Lunch,Total Meals Claimed\n';

            for (const team of teams) {
                const raw = (team.raw_data as Record<string, any>) || {};
                const members = Array.isArray(team.members) && team.members.length > 0 ? team.members : ((raw.members as any[]) || []);
                const mealState = (team.member_meal_state as Record<string, any>) || {};

                members.forEach((member: any, index: number) => {
                    const memberKey = member.email ? String(member.email).trim().toLowerCase() : `member_${index}`;
                    const memberName = member.fullName || member.name || (index === 0 ? team.captain : `Member ${index + 1}`);
                    const memberSlots = mealState[memberKey] || {};

                    const getStatus = (mealKey: string) => {
                        const slot = memberSlots[mealKey];
                        if (slot?.claimedAt) {
                            return `Claimed (${new Date(slot.claimedAt).toLocaleTimeString()})`;
                        }
                        return 'Unclaimed';
                    };

                    const d1Breakfast = getStatus('day1_breakfast');
                    const d1Lunch = getStatus('day1_lunch');
                    const d1Snacks = getStatus('day1_snacks');
                    const d1Dinner = getStatus('day1_dinner');
                    const d2Breakfast = getStatus('day2_breakfast');
                    const d2Lunch = getStatus('day2_lunch');

                    const totalClaimed = [d1Breakfast, d1Lunch, d1Snacks, d1Dinner, d2Breakfast, d2Lunch].filter(s => s.startsWith('Claimed')).length;

                    csvContent += [
                        escapeCsv(team.team_id || ''),
                        escapeCsv(team.team_name || raw.teamName || ''),
                        escapeCsv(memberName),
                        escapeCsv(member.email || memberKey),
                        escapeCsv(index === 0 ? 'Captain' : 'Member'),
                        escapeCsv(d1Breakfast),
                        escapeCsv(d1Lunch),
                        escapeCsv(d1Snacks),
                        escapeCsv(d1Dinner),
                        escapeCsv(d2Breakfast),
                        escapeCsv(d2Lunch),
                        totalClaimed
                    ].join(',') + '\n';
                });
            }
        }

        // ═════════════════════════════════════════════════════════
        // 5. VENUE CHECK-IN & ROOM DIRECTORY
        // ═════════════════════════════════════════════════════════
        else if (type === 'checkin') {
            const teams = await fetchAllRegistrations();
            csvContent = 'Team ID,Team Name,Track,Captain,Captain Phone,Captain Email,College,Check-In Status,Checked-In At,Assigned Room,Assigned Volunteer,Room WiFi SSID\n';

            for (const team of teams) {
                const raw = (team.raw_data as Record<string, any>) || {};
                const checkedInAt = team.raw_data?.checkedInAt || (team.is_checked_in ? team.completed_at : null);

                csvContent += [
                    escapeCsv(team.team_id || ''),
                    escapeCsv(team.team_name || raw.teamName || ''),
                    escapeCsv(team.track || ''),
                    escapeCsv(team.captain || ''),
                    escapeCsv(team.captain_mobile || ''),
                    escapeCsv(team.email || ''),
                    escapeCsv(team.college || raw.college || ''),
                    escapeCsv(team.is_checked_in ? 'Checked In' : 'Pending'),
                    escapeCsv(checkedInAt ? new Date(checkedInAt).toLocaleString() : 'N/A'),
                    escapeCsv(team.room || 'Unassigned'),
                    escapeCsv(team.volunteer_name || 'Unassigned'),
                    escapeCsv(team.room_wifi_ssid || 'Unassigned')
                ].join(',') + '\n';
            }
        }

        // ═════════════════════════════════════════════════════════
        // 6. ALL PARTICIPANT EMAILS (MAIL MERGE)
        // ═════════════════════════════════════════════════════════
        else if (type === 'emails') {
            const teams = await fetchAllRegistrations();
            csvContent = 'Email,Full Name,Phone,Team ID,Team Name,Role,College,Track\n';

            for (const team of teams) {
                const raw = (team.raw_data as Record<string, any>) || {};
                const members = Array.isArray(team.members) && team.members.length > 0 ? team.members : ((raw.members as any[]) || []);
                const teamName = team.team_name || raw.teamName || 'Unknown Team';

                members.forEach((member: any, index: number) => {
                    if (member && member.email) {
                        csvContent += [
                            escapeCsv(member.email.trim()),
                            escapeCsv(member.fullName || member.name || ''),
                            escapeCsv(member.phone || (index === 0 ? team.captain_mobile : '')),
                            escapeCsv(team.team_id || ''),
                            escapeCsv(teamName),
                            escapeCsv(index === 0 ? 'Captain' : 'Member'),
                            escapeCsv(member.college || team.college || ''),
                            escapeCsv(team.track || '')
                        ].join(',') + '\n';
                    }
                });
            }
        }

        // ═════════════════════════════════════════════════════════
        // 7. DIETARY RESTRICTIONS
        // ═════════════════════════════════════════════════════════
        else if (type === 'dietary') {
            const teams = await fetchAllRegistrations();
            csvContent = 'Team ID,Team Name,Member Name,Role,Dietary Notes\n';

            for (const team of teams) {
                const raw = (team.raw_data as Record<string, any>) || {};
                const members = Array.isArray(team.members) && team.members.length > 0 ? team.members : ((raw.members as any[]) || []);
                const teamName = team.team_name || raw.teamName || 'Unknown Team';

                members.forEach((member: any, index: number) => {
                    const dietary = member.dietary || member.diet || member.foodPreference || member.mealPreference || '';
                    if (dietary) {
                        csvContent += [
                            escapeCsv(team.team_id || ''),
                            escapeCsv(teamName),
                            escapeCsv(member.fullName || member.name || ''),
                            escapeCsv(index === 0 ? 'Captain' : 'Member'),
                            escapeCsv(dietary)
                        ].join(',') + '\n';
                    }
                });
            }
        }

        // ═════════════════════════════════════════════════════════
        // 8. JUDGES DIRECTORY
        // ═════════════════════════════════════════════════════════
        else if (type === 'judges') {
            const { data, error } = await supabase
                .from('judges')
                .select('generated_id, name, specialization, created_at')
                .order('generated_id');
            if (error) throw error;

            csvContent = 'Judge ID,Name,Specialization,Created At\n';
            for (const judge of data || []) {
                csvContent += [
                    escapeCsv(judge.generated_id),
                    escapeCsv(judge.name),
                    escapeCsv(judge.specialization || 'General'),
                    escapeCsv(judge.created_at ? new Date(judge.created_at).toLocaleString() : '')
                ].join(',') + '\n';
            }
        }

        // ═════════════════════════════════════════════════════════
        // 9. VOLUNTEERS DIRECTORY
        // ═════════════════════════════════════════════════════════
        else if (type === 'volunteers') {
            const { data, error } = await supabase
                .from('volunteers')
                .select('generated_id, name, phone, role, created_at')
                .order('generated_id');
            if (error) throw error;

            csvContent = 'Volunteer ID,Name,Phone,Role,Created At\n';
            for (const vol of data || []) {
                csvContent += [
                    escapeCsv(vol.generated_id),
                    escapeCsv(vol.name),
                    escapeCsv(vol.phone || ''),
                    escapeCsv(vol.role || 'Event Operations'),
                    escapeCsv(vol.created_at ? new Date(vol.created_at).toLocaleString() : '')
                ].join(',') + '\n';
            }
        }

        // ═════════════════════════════════════════════════════════
        // 10. MASTER COMPREHENSIVE DUMP (ALL IN ONE)
        // ═════════════════════════════════════════════════════════
        else if (type === 'master') {
            const [teams, { data: evaluations }] = await Promise.all([
                fetchAllRegistrations(),
                supabase
                    .from('judging_evaluations')
                    .select('team_id, round_id, total_score')
                    .eq('status', 'submitted')
            ]);

            const masterEvalMap = new Map<string, Map<string, number[]>>();
            (evaluations || []).forEach(ev => {
                let existing = masterEvalMap.get(ev.team_id);
                if (!existing) {
                    existing = new Map();
                    masterEvalMap.set(ev.team_id, existing);
                }
                const score = Number(ev.total_score);
                if (Number.isFinite(score)) {
                    const roundId = String(ev.round_id || '').toLowerCase();
                    const cur = existing.get(roundId) || [];
                    cur.push(score);
                    existing.set(roundId, cur);
                }
            });

            csvContent = 'Team ID,Transaction ID,Team Name,Track,Problem Statement,College,Captain,Captain Email,Captain Phone,Members Count,Status,Check-In Status,Room,Volunteer,GitHub URL,Presentation URL,Demo URL,Deployment URL,Final Submission,Round 1 Score,Round 2 Score,Total Score\n';

            for (const team of teams) {
                const raw = (team.raw_data as Record<string, any>) || {};
                const members = Array.isArray(team.members) && team.members.length > 0 ? team.members : ((raw.members as any[]) || []);
                const sub = (raw.submission as Record<string, any>) || {};
                const scores = (team.round_scores as Record<string, any>) || {};
                const teamId = team.team_id || '';

                const evals = masterEvalMap.get(teamId);
                const r1Evals = evals ? (evals.get('round1') || evals.get('r1') || evals.get('round-1') || evals.get('round_1')) : undefined;
                const r1EvalScore = r1Evals && r1Evals.length > 0 ? Number((r1Evals.reduce((a, b) => a + b, 0) / r1Evals.length).toFixed(1)) : 0;

                const r2Evals = evals ? (evals.get('round2') || evals.get('r2') || evals.get('round-2') || evals.get('round_2')) : undefined;
                const r2EvalScore = r2Evals && r2Evals.length > 0 ? Number((r2Evals.reduce((a, b) => a + b, 0) / r2Evals.length).toFixed(1)) : 0;

                const r1 = getTeamRoundScore(scores, ['round1', 'r1', 'round-1', 'round_1'], r1EvalScore);
                const r2 = getTeamRoundScore(scores, ['round2', 'r2', 'round-2', 'round_2'], r2EvalScore);
                const totalScore = Number((r1 + r2).toFixed(1));

                csvContent += [
                    escapeCsv(teamId),
                    escapeCsv(team.transaction_id || ''),
                    escapeCsv(team.team_name || raw.teamName || ''),
                    escapeCsv(team.track || ''),
                    escapeCsv(team.problem_statement || ''),
                    escapeCsv(team.college || raw.college || ''),
                    escapeCsv(team.captain || ''),
                    escapeCsv(team.email || ''),
                    escapeCsv(team.captain_mobile || ''),
                    members.length,
                    escapeCsv(team.status || 'PENDING'),
                    escapeCsv(team.is_checked_in ? 'Checked In' : 'Pending'),
                    escapeCsv(team.room || ''),
                    escapeCsv(team.volunteer_name || ''),
                    escapeCsv(team.github_url || sub.github || sub.repo || ''),
                    escapeCsv(team.presentation_url || sub.presentation || ''),
                    escapeCsv(team.demo_url || sub.demo || sub.video || ''),
                    escapeCsv(team.deployment_url || sub.deployment || ''),
                    escapeCsv(team.is_final_submission || sub.isFinal ? 'Yes' : 'No'),
                    r1,
                    r2,
                    totalScore
                ].join(',') + '\n';
            }
        }

        const filename = `Happeno_${type}_export_${todayStr}.csv`;

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Cache-Control': 'no-store'
            }
        });
    } catch (error) {
        console.error('CSV export failed:', error);
        return NextResponse.json({ error: 'Could not generate export.' }, { status: 500 });
    }
}
