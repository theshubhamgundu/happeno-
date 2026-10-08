const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const teamId = 'TRI26058';
  
  const { data: team, error: fetchErr } = await supabase
    .from('registrations')
    .select('meal_access, members')
    .eq('team_id', teamId)
    .single();
    
  if (fetchErr || !team) {
    console.error('Error fetching team:', fetchErr);
    return;
  }
  
  const mealAccess = typeof team.meal_access === 'object' && team.meal_access !== null ? team.meal_access : {};
  mealAccess.purchased_meals = ['all'];
  mealAccess.networking_passes = ['all'];
  
  let members = team.members;
  if (Array.isArray(members)) {
    members = members.map(m => {
        return { ...m, networking_pass: true };
    });
  }
  
  const { error: updateErr } = await supabase
    .from('registrations')
    .update({ meal_access: mealAccess, members: members })
    .eq('team_id', teamId);
    
  if (updateErr) {
    console.error('Error updating:', updateErr);
  } else {
    console.log('Successfully updated TRI26058 with full meal and networking access.');
  }
}

run();
