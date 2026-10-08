const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const teamId = 'TRI26058';
  
  const { data: team, error: fetchErr } = await supabase
    .from('registrations')
    .select('raw_data')
    .eq('team_id', teamId)
    .single();
    
  if (fetchErr || !team) {
    console.error('Error fetching team:', fetchErr);
    return;
  }
  
  const rawData = team.raw_data || {};
  rawData.rabbit_race_score = 98;
  
  const { error: updateErr } = await supabase
    .from('registrations')
    .update({ raw_data: rawData })
    .eq('team_id', teamId);
    
  if (updateErr) {
    console.error('Error updating:', updateErr);
  } else {
    console.log('Successfully updated TRI26058 to 98');
  }
}

run();
