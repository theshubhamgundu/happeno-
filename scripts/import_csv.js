const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const fetchFn = fetch;

async function importCsv() {
    const csvFilePath = path.join(__dirname, '..', 'Book1_with_phones.csv');
    
    if (!fs.existsSync(csvFilePath)) {
        console.error(`CSV file not found at ${csvFilePath}`);
        process.exit(1);
    }

    const csvData = fs.readFileSync(csvFilePath, 'utf8');

    // Parse the CSV
    const results = Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim()
    });

    if (results.errors.length > 0) {
        console.error('Errors parsing CSV:', results.errors);
        process.exit(1);
    }

    const rows = results.data;
    const teamsMap = new Map();

    for (const row of rows) {
        const teamId = row['Registration ID']?.trim();
        const teamName = row['Team Name']?.trim();
        const role = row['Role']?.trim();
        const fullName = row['Name']?.trim();
        const college = row['College']?.trim();
        const email = row['Email']?.trim();
        const year = row['Year']?.trim();
        const department = row['Department']?.trim();
        const phone = row['Phone Number']?.trim();
        const track = row['Selected Tracks']?.trim();

        if (!teamId || !fullName) continue;

        if (!teamsMap.has(teamId)) {
            teamsMap.set(teamId, {
                teamName: teamName || `Team ${teamId}`,
                track: track || 'TBD',
                problemStatement: '',
                participants: []
            });
        }

        const team = teamsMap.get(teamId);
        
        // Push participant
        const participant = {
            fullName,
            email: email || '',
            phone: phone || '',
            college: college || '',
            year: year || '',
            department: department || ''
        };

        // Ensure Team Leader is first
        if (role && role.toLowerCase().includes('leader')) {
            team.participants.unshift(participant);
        } else {
            team.participants.push(participant);
        }
    }

    const registrations = Array.from(teamsMap.values());
    console.log(`Parsed ${registrations.length} distinct teams from the CSV.`);
    
    const payload = { registrations };
    
    const outputPath = path.join(__dirname, '..', 'data', 'registrations.json');
    fs.writeFileSync(outputPath, JSON.stringify(registrations, null, 2), 'utf8');
    
    console.log(`✅ Successfully saved ${registrations.length} teams to data/registrations.json`);
}

importCsv();
