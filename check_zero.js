const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: teams, error } = await supabase
    .from('registrations')
    .select('team_id, raw_data');
    
  if (error) {
    console.error(error);
    return;
  }
  
  let zeroCount = 0;
  let totalCount = teams.length;
  let hasScoreCount = 0;
  
  for (const team of teams) {
    const rawData = team.raw_data || {};
    if (rawData.rabbit_race_score === 0 || rawData.rabbit_race_score === '0') {
      zeroCount++;
    }
    if (rawData.rabbit_race_score !== undefined) {
      hasScoreCount++;
    }
  }
  
  console.log(`Total Teams: ${totalCount}`);
  console.log(`Teams with ANY rabbit race score: ${hasScoreCount}`);
  console.log(`Teams with exactly 0 rabbit race score: ${zeroCount}`);
}

run();
