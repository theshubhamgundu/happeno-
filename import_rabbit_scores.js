const xlsx = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const workbook = xlsx.readFile('C:\\Users\\gkaru\\Downloads\\rabbit race score team wise.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);
  
  let successCount = 0;
  let failCount = 0;

  for (const row of data) {
    const teamId = row['Team ID'];
    const score = row['Common Team Total Score (/100)'];
    
    if (!teamId || score === undefined) continue;
    
    const { data: team, error: fetchErr } = await supabase
      .from('registrations')
      .select('raw_data')
      .eq('team_id', teamId)
      .maybeSingle();
      
    if (fetchErr) {
      console.error(`Error fetching ${teamId}:`, fetchErr);
      failCount++;
      continue;
    }
    if (!team) {
      console.warn(`Team ${teamId} not found in DB`);
      failCount++;
      continue;
    }
    
    const rawData = team.raw_data || {};
    rawData.rabbit_race_score = score;
    
    const { error: updateErr } = await supabase
      .from('registrations')
      .update({ raw_data: rawData })
      .eq('team_id', teamId);
      
    if (updateErr) {
      console.error(`Error updating ${teamId}:`, updateErr);
      failCount++;
    } else {
      successCount++;
    }
  }
  
  console.log(`Finished updating. Success: ${successCount}, Failed: ${failCount}`);
}

run();
