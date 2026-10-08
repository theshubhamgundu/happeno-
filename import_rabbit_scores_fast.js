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
  
  console.log(`Starting to process ${data.length} records...`);

  // Batch process
  const batchSize = 10;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (row) => {
      const teamId = row['Team ID'];
      const score = row['Common Team Total Score (/100)'];
      
      if (!teamId || score === undefined) return;
      
      try {
        const { data: team, error: fetchErr } = await supabase
          .from('registrations')
          .select('raw_data')
          .eq('team_id', teamId)
          .maybeSingle();
          
        if (fetchErr || !team) {
            // Probably already failed in the previous script or doesn't exist
            return;
        }
        
        const rawData = team.raw_data || {};
        // If already updated by the previous script, skip it to save time
        if (rawData.rabbit_race_score === score) {
            successCount++;
            return;
        }

        rawData.rabbit_race_score = score;
        
        const { error: updateErr } = await supabase
          .from('registrations')
          .update({ raw_data: rawData })
          .eq('team_id', teamId);
          
        if (updateErr) {
          failCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        failCount++;
      }
    }));
    
    if (i % 50 === 0) console.log(`Processed ${i} records...`);
  }
  
  console.log(`Finished updating. Success: ${successCount}, Failed: ${failCount}`);
}

run();
