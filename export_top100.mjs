import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: teams, error } = await supabase
    .from('registrations')
    .select('*')
    .neq('status', 'MERGED');

  if (error) {
    console.error('Error querying registrations:', error);
    return;
  }

  const scoredTeams = teams.map(t => {
    const roundScores = t.round_scores || {};
    const rawData = t.raw_data || {};
    
    // R1 Score (out of 200)
    const r1Obj = roundScores['round1'] || {};
    const r1Values = Object.values(r1Obj).map(Number).filter(n => Number.isFinite(n));
    const r1Score = r1Values.length ? r1Values.reduce((a, b) => a + b, 0) / r1Values.length : null;

    // R2 Score (out of 200)
    const r2Obj = roundScores['round2'] || {};
    const r2Values = Object.values(r2Obj).map(Number).filter(n => Number.isFinite(n));
    const r2Score = r2Values.length ? r2Values.reduce((a, b) => a + b, 0) / r2Values.length : null;

    // Rabbit race (out of 100)
    const rabbit = Number(rawData.rabbit_race_score) || 0;

    let total = 0;
    let hasScore = false;
    if (r1Score !== null) { total += r1Score; hasScore = true; }
    if (r2Score !== null) { total += r2Score; hasScore = true; }
    if (rabbit > 0) { total += rabbit; hasScore = true; }

    // Resolve college: check team college and members' colleges
    const members = Array.isArray(t.members) ? t.members : [];
    const colleges = Array.from(new Set([t.college, ...members.map(m => typeof m === 'object' ? m?.college : null)].filter(Boolean)));
    const collegeStr = colleges.join(' / ') || 'N/A';

    return {
      teamId: t.team_id || '',
      teamName: t.team_name || 'Untitled Team',
      track: t.track || rawData.track || 'General',
      college: collegeStr,
      captain: t.captain || '',
      captainMobile: t.captain_mobile || '',
      memberCount: members.length,
      r1Score: r1Score !== null ? Number(r1Score.toFixed(1)) : 0,
      r2Score: r2Score !== null ? Number(r2Score.toFixed(1)) : 0,
      rabbitRace: rabbit,
      totalScore: hasScore ? Number(total.toFixed(1)) : 0
    };
  });

  const sorted = scoredTeams
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 100);

  fs.writeFileSync('top100_teams.json', JSON.stringify(sorted, null, 2));

  // CSV format
  const headers = ['Rank', 'Team ID', 'Team Name', 'College', 'Track', 'Captain', 'Captain Mobile', 'Members', 'Round 1 (/200)', 'Round 2 (/200)', 'Rabbit Race (/100)', 'Total Score (/500)'];
  const csvRows = [headers.join(',')];
  sorted.forEach((t, idx) => {
    csvRows.push([
      idx + 1,
      `"${t.teamId}"`,
      `"${t.teamName.replace(/"/g, '""')}"`,
      `"${t.college.replace(/"/g, '""')}"`,
      `"${t.track.replace(/"/g, '""')}"`,
      `"${t.captain.replace(/"/g, '""')}"`,
      `"${t.captainMobile}"`,
      t.memberCount,
      t.r1Score,
      t.r2Score,
      t.rabbitRace,
      t.totalScore
    ].join(','));
  });

  fs.writeFileSync('top100_teams.csv', csvRows.join('\n'));
  console.log('SUCCESS: Generated top100_teams.json and top100_teams.csv');
}

run();
