require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log('Reading original CSV file...');
    let data = fs.readFileSync('C:/Users/gkaru/Downloads/Tricity AI Hackathon 2026 - All Participants.csv', 'utf8');
    
    // Remove BOM
    if (data.charCodeAt(0) === 0xFEFF) data = data.slice(1);
    
    const lines = data.split('\n').filter(l => l.trim() !== '');
    const teamMap = {};
    
    // CSV doesn't have internal quotes with commas, just standard commas
    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map(val => val.trim());
        const teamId = row[0];
        if (!teamId) continue;
        if (!teamMap[teamId]) teamMap[teamId] = [];
        teamMap[teamId].push({
            role: row[2],
            name: row[3],
            email: row[4],
            phone: row[5],
            foodIndividual: row[13] === '1',
            activityIndividual: row[14] === '1'
        });
    }
    
    console.log(`Parsed ${Object.keys(teamMap).length} teams. Updating database...`);
    
    // Fetch all teams from DB at once to make it fast
    const { data: dbTeams, error: fetchErr } = await supabase.from('registrations').select('team_id, members');
    if (fetchErr) {
        console.error('Failed to fetch DB teams:', fetchErr);
        return;
    }
    
    let updated = 0;
    
    // Create an update array for Promise.all to make it very fast
    const updatePromises = [];
    
    for (const dbTeam of dbTeams) {
        const teamId = dbTeam.team_id;
        const csvRows = teamMap[teamId];
        if (!csvRows || !dbTeam.members) continue;
        
        const purchased_meals = [];
        const networking_passes = [];
        
        for (let i = 0; i < csvRows.length; i++) {
            const csvRow = csvRows[i];
            
            // Try to find matching member in DB
            let member = dbTeam.members.find(m => m.email?.toLowerCase() === csvRow.email.toLowerCase());
            
            // Fallback to phone
            if (!member) {
                member = dbTeam.members.find(m => m.phone === csvRow.phone);
            }
            // Fallback to exact index
            if (!member && i < dbTeam.members.length) {
                member = dbTeam.members[i];
            }
            
            if (member && member.participant_id) {
                if (csvRow.foodIndividual) purchased_meals.push(member.participant_id);
                if (csvRow.activityIndividual) networking_passes.push(member.participant_id);
            }
        }
        
        const mealAccess = { purchased_meals, networking_passes };
        
        updatePromises.push(
            supabase.from('registrations').update({ meal_access: mealAccess }).eq('team_id', teamId).then(({error}) => {
                if (error) console.error('Failed to update:', teamId, error);
                else updated++;
            })
        );
    }
    
    await Promise.all(updatePromises);
    console.log(`Successfully mapped and populated meal_access for ${updated} teams using robust UUID matching!`);
}

run();
