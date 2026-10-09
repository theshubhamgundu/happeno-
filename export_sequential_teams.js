require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function exportData() {
  const { data, error } = await supabase.from('registrations').select('team_id, team_name, members, status');
  if (error) throw error;
  
  // Sort teams sequentially by team_id
  data.sort((a, b) => {
    // Extract the numeric part of TRIXXXXX
    const numA = parseInt((a.team_id || '').replace('TRI', '')) || 0;
    const numB = parseInt((b.team_id || '').replace('TRI', '')) || 0;
    return numA - numB;
  });

  let csvContent = 'Team ID,Team Name,Status,Number of Members\n';
  data.forEach(team => {
    const numMembers = Array.isArray(team.members) ? team.members.length : 0;
    const safeName = (team.team_name || 'Unknown').replace(/,/g, ' ');
    csvContent += `${team.team_id},${safeName},${team.status},${numMembers}\n`;
  });

  fs.writeFileSync('teams_summary_sequential.csv', csvContent);
  console.log('Total teams:', data.length);
  console.log('File saved to teams_summary_sequential.csv');
}

exportData();
