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
  
  let updatedCount = 0;
  
  // Batch process
  const batchSize = 50;
  for (let i = 0; i < teams.length; i += batchSize) {
    const batch = teams.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (team) => {
      const rawData = team.raw_data || {};
      if (rawData.rabbit_race_score === undefined || rawData.rabbit_race_score === null) {
        rawData.rabbit_race_score = 0;
        await supabase
          .from('registrations')
          .update({ raw_data: rawData })
          .eq('team_id', team.team_id);
        updatedCount++;
      }
    }));
  }
  
  console.log(`Found and updated ${updatedCount} teams with a score of 0 (did not participate).`);
}

run();
