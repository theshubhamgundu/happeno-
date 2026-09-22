const fs = require('fs');
const path = require('path');

function generatePassword(length = 6) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

const dataPath = path.join(__dirname, '..', 'data', 'registrations.json');

if (!fs.existsSync(dataPath)) {
    console.error('registrations.json not found!');
    process.exit(1);
}

const rawData = fs.readFileSync(dataPath, 'utf8');
const teams = JSON.parse(rawData);

let updatedCount = 0;
const csvLines = ['team_id,team_name,password'];

teams.forEach((team, index) => {
    // Generate teamId if missing (matches API logic)
    if (!team.teamId) {
        team.teamId = `LOCAL-${index}`;
    }
    
    // Generate password if missing
    if (!team.password) {
        team.password = generatePassword();
        updatedCount++;
    }

    csvLines.push(`${team.teamId},"${(team.teamName || '').replace(/"/g, '""')}",${team.password}`);
});

// Write back to JSON
fs.writeFileSync(dataPath, JSON.stringify(teams, null, 2), 'utf8');
console.log(`✅ Updated ${updatedCount} teams with passwords in registrations.json`);

// Write CSV
const csvPath = path.join(__dirname, '..', 'team_passwords.csv');
fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf8');
console.log(`📄 Password list saved to: ${csvPath}`);
