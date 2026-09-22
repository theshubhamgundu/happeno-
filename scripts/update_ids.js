const fs = require('fs');
const csv = fs.readFileSync('Book1_updated (1).csv', 'utf8');
const lines = csv.split('\n');

const data = JSON.parse(fs.readFileSync('data/registrations.json', 'utf8'));

// map team name + captain name to registration ID?
// Actually, teams are ordered or we can match by email or phone.
let idMap = {};
for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    // Registration ID,Team Name,Role,Name,College,Email,Year,Department,Phone Number,Selected Tracks
    // Note: Some CSVs have quotes. A simple split by comma might fail if quotes are used.
    // Let's use a regex or just match the first column (Registration ID) and the 6th column (Email)
    // Or just look for the email in the file.
    let cols = line.split(',');
    if (cols.length >= 6) {
        let regId = cols[0];
        let email = cols[5].replace(/"/g, '').trim();
        idMap[email.toLowerCase()] = regId;
    }
}

// Now update data
let count = 0;
for (let team of data) {
    // Find the registration ID by looking up the participant emails
    for (let p of team.participants) {
        if (p.email && idMap[p.email.toLowerCase()]) {
            team.teamId = idMap[p.email.toLowerCase()];
            count++;
            break;
        }
    }
}

fs.writeFileSync('data/registrations.json', JSON.stringify(data, null, 2), 'utf8');
console.log(`Updated ${count} teams with their real TRI IDs.`);
