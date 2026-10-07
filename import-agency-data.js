require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log('Reading agency data file...');
    let data = fs.readFileSync('C:/Users/gkaru/Downloads/TriCity_Participant_Addon_Status_2026-10-07.csv', 'utf8');
    
    // Remove BOM
    if (data.charCodeAt(0) === 0xFEFF) {
        data = data.slice(1);
    }
    
    const lines = data.split('\n').filter(l => l.trim() !== '');
    
    // Split by comma, but handle quotes
    function parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (c === '"') {
                inQuotes = !inQuotes;
            } else if (c === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += c;
            }
        }
        result.push(current);
        return result;
    }
    
    const headers = parseCSVLine(lines[0]).map(h => h.trim());
    
    const teamIdIdx = headers.indexOf('Team ID');
    const participantIdIdx = headers.indexOf('Participant ID');
    const mealIdx = headers.indexOf('Meal Pass Purchased');
    const networkIdx = headers.indexOf('Networking / City Activity Pass Purchased');
    
    console.log('Indexes:', { teamIdIdx, participantIdIdx, mealIdx, networkIdx });
    
    const teamMap = {};
    
    for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]).map(val => val.trim());
        
        if (row.length <= Math.max(mealIdx, networkIdx)) continue;
        
        const teamId = row[teamIdIdx];
        const participantId = row[participantIdIdx];
        const mealYes = row[mealIdx].toLowerCase() === 'yes';
        const netYes = row[networkIdx].toLowerCase() === 'yes';
        
        if (!teamId || !participantId) continue;
        
        if (!teamMap[teamId]) {
            teamMap[teamId] = {
                purchased_meals: [],
                networking_passes: []
            };
        }
        
        if (mealYes) teamMap[teamId].purchased_meals.push(participantId);
        if (netYes) teamMap[teamId].networking_passes.push(participantId);
    }
    
    console.log(`Parsed ${Object.keys(teamMap).length} teams. Updating database...`);
    
    let updated = 0;
    for (const [teamId, access] of Object.entries(teamMap)) {
        const { error } = await supabase.from('registrations').update({ meal_access: access }).eq('team_id', teamId);
        if (error) {
            console.error('Failed to update team:', teamId, error);
        } else {
            updated++;
        }
    }
    console.log(`Successfully populated meal_access for ${updated} teams using exact UUIDs!`);
}

run();
