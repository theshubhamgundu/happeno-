import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: regs } = await supabase.from('registrations').select('team_id, team_name, members, meal_access');
  let csv = 'Team ID,Team Name,Member Name,Phone Number\n';
  regs.forEach(r => {
    const mealAccess = r.meal_access || {};
    const claimed = Array.isArray(mealAccess.dinner_claimed) ? mealAccess.dinner_claimed : [];
    if (claimed.length > 0) {
      claimed.forEach(memberId => {
        const member = (r.members || []).find(m => (m.participant_id || m.id) === memberId);
        let name = member ? (member.fullName || member.name || memberId) : memberId;
        let phone = member ? (member.phone || member.phoneNumber || member.mobile || 'N/A') : 'N/A';
        // escape commas
        name = '"' + name.replace(/"/g, '""') + '"';
        const teamName = '"' + (r.team_name || '').replace(/"/g, '""') + '"';
        csv += r.team_id + ',' + teamName + ',' + name + ',' + phone + '\n';
      });
    }
  });
  fs.writeFileSync('claimed_meals.csv', csv);
  console.log('CSV Created.');
}
run();
