require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function exportNetworkingTeams() {
  const { data, error } = await supabase.from('registrations').select('team_id, team_name, members, meal_access, status');
  if (error) throw error;
  
  let networkingTeams = [];

  data.forEach(team => {
    let hasNetworking = false;
    let networkingCount = 0;
    const members = Array.isArray(team.members) ? team.members : [];
    
    // Check meal_access
    const passes = team.meal_access?.networking_passes;
    if (Array.isArray(passes)) {
      if (passes.includes('all')) {
        hasNetworking = true;
        networkingCount = members.length;
      } else if (passes.length > 0) {
        hasNetworking = true;
        networkingCount = passes.length;
      }
    } else if (passes === true) {
      hasNetworking = true;
      networkingCount = members.length;
    }

    // Check legacy flags in members array just to be safe
    if (!hasNetworking) {
      let legacyCount = 0;
      members.forEach(m => {
        if (m.networking_pass === true) legacyCount++;
      });
      if (legacyCount > 0) {
        hasNetworking = true;
        networkingCount = legacyCount;
      }
    }

    if (hasNetworking) {
      networkingTeams.push({
        team_id: team.team_id,
        team_name: team.team_name,
        count: networkingCount
      });
    }
  });

  // Sort sequentially
  networkingTeams.sort((a, b) => {
    const numA = parseInt((a.team_id || '').replace('TRI', '')) || 0;
    const numB = parseInt((b.team_id || '').replace('TRI', '')) || 0;
    return numA - numB;
  });

  let csvContent = 'Team ID,Team Name,Networking Passes Count\n';
  networkingTeams.forEach(team => {
    const safeName = (team.team_name || 'Unknown').replace(/,/g, ' ');
    csvContent += `${team.team_id},${safeName},${team.count}\n`;
  });

  fs.writeFileSync('networking_teams.csv', csvContent);
  console.log('Total teams with networking passes:', networkingTeams.length);
  console.log('File saved to networking_teams.csv');
}

exportNetworkingTeams();
