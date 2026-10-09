require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function allocateRooms() {
  console.log('Reading CSV file...');
  const csvData = fs.readFileSync('C:\\Users\\gkaru\\Downloads\\participant_room_allocation_clean.csv', 'utf8');
  
  const lines = csvData.split('\n').filter(line => line.trim() !== '');
  
  // Skip header
  if (lines[0].includes('Team ID')) {
    lines.shift();
  }

  const allocations = [];
  for (let line of lines) {
    const parts = line.split(',');
    if (parts.length >= 2) {
      allocations.push({
        teamId: parts[0].trim(),
        room: parts[1].trim()
      });
    }
  }

  console.log(`Found ${allocations.length} allocations in CSV.`);
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (let i = 0; i < allocations.length; i++) {
    const { teamId, room } = allocations[i];
    
    const { data, error } = await supabase
      .from('registrations')
      .update({ room: room })
      .eq('team_id', teamId)
      .select('team_id');
      
    if (error) {
      errorCount++;
      errors.push(`Error updating ${teamId}: ${error.message}`);
    } else if (!data || data.length === 0) {
      errorCount++;
      errors.push(`Warning: Team ${teamId} not found in database.`);
    } else {
      successCount++;
    }
    
    // Progress logging
    if ((i + 1) % 50 === 0 || i === allocations.length - 1) {
      console.log(`Processed ${i + 1}/${allocations.length}...`);
    }
  }

  console.log('\n--- ALLOCATION REPORT ---');
  console.log(`Total Teams Processed: ${allocations.length}`);
  console.log(`Successfully Updated: ${successCount}`);
  console.log(`Failed / Not Found: ${errorCount}`);
  
  if (errors.length > 0) {
    console.log('\nIssues found:');
    errors.forEach(e => console.log(e));
  }
}

allocateRooms().catch(console.error);
