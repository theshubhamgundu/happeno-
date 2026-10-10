import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: registrations, error: fetchErr } = await supabase
    .from('registrations')
    .select('team_id, team_name, members, meal_access');
    
  if (fetchErr) {
    console.error('Fetch error:', fetchErr);
    return;
  }
  
  let updatedCount = 0;
  
  for (const team of registrations) {
    const mealAccess = team.meal_access || {};
    const dinnerClaimed = Array.isArray(mealAccess.dinner_claimed) ? mealAccess.dinner_claimed : [];
    
    // Only process teams that have at least one meal claimed (meaning they were scanned)
    if (dinnerClaimed.length > 0) {
      const purchased = Array.isArray(mealAccess.purchased_meals) ? mealAccess.purchased_meals : [];
      let eligibleIds = [];
      
      if (purchased.includes('all')) {
        // all members
        if (Array.isArray(team.members)) {
          eligibleIds = team.members.map(m => m.participant_id || m.id).filter(Boolean);
        }
      } else {
        // specific members
        eligibleIds = purchased;
      }
      
      // We want to make sure all eligible members are marked as claimed
      let updated = false;
      const newClaimed = new Set(dinnerClaimed);
      for (const id of eligibleIds) {
        if (!newClaimed.has(id)) {
          newClaimed.add(id);
          updated = true;
        }
      }
      
      if (updated) {
        const finalClaimed = Array.from(newClaimed);
        const { error: updateErr } = await supabase
          .from('registrations')
          .update({
            meal_access: {
              ...mealAccess,
              dinner_claimed: finalClaimed
            }
          })
          .eq('team_id', team.team_id);
          
        if (updateErr) {
          console.error(`Failed to update ${team.team_name}:`, updateErr);
        } else {
          console.log(`Updated ${team.team_name}: Claimed went from ${dinnerClaimed.length} to ${finalClaimed.length}`);
          updatedCount++;
        }
      }
    }
  }
  
  console.log(`Finished! Updated ${updatedCount} teams.`);
}

run();
