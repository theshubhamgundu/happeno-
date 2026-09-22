/**
 * Generate and set passwords for all teams that don't have one.
 * 
 * Run with: node scripts/set_passwords.js
 * 
 * This calls the local Next.js dev server API to fetch teams,
 * generates a random 6-char password for each team missing one,
 * and updates them via the Supabase API.
 * 
 * Outputs a CSV with team_id,team_name,password for reference.
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

function generatePassword(length = 6) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars (0,O,1,I)
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function main() {
    console.log('📡 Fetching all teams from API...');

    const res = await fetch(`${BASE_URL}/api/teams`);
    if (!res.ok) {
        console.error('❌ Failed to fetch teams:', res.status, await res.text());
        process.exit(1);
    }

    const teams = await res.json();
    console.log(`✅ Found ${teams.length} teams`);

    const teamsNeedingPassword = teams.filter(t => !t.password || t.password.trim() === '');
    console.log(`🔐 ${teamsNeedingPassword.length} teams need passwords`);

    if (teamsNeedingPassword.length === 0) {
        console.log('✅ All teams already have passwords!');

        // Still output the full list
        const csvLines = ['team_id,team_name,password'];
        for (const team of teams) {
            csvLines.push(`${team.teamId},"${(team.name || '').replace(/"/g, '""')}",${team.password}`);
        }
        const csvPath = path.join(__dirname, '..', 'team_passwords.csv');
        fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf8');
        console.log(`📄 Full password list saved to: ${csvPath}`);
        return;
    }

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const team of teamsNeedingPassword) {
        const password = generatePassword();

        try {
            // Use the Supabase client directly via a small API call
            const updateRes = await fetch(`${BASE_URL}/api/teams`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: team.id || team.teamId, password: password }),
            });

            if (updateRes.ok) {
                successCount++;
                results.push({ teamId: team.teamId, name: team.name, password });
                console.log(`  ✅ ${team.teamId} (${team.name}) → ${password}`);
            } else {
                failCount++;
                console.error(`  ❌ ${team.teamId}: ${updateRes.status}`);
            }
        } catch (err) {
            failCount++;
            console.error(`  ❌ ${team.teamId}: ${err.message}`);
        }
    }

    console.log(`\n📊 Done! ${successCount} updated, ${failCount} failed`);

    // Write CSV with ALL teams (existing + new passwords)
    const csvLines = ['team_id,team_name,password'];
    
    // Teams that already had passwords
    for (const team of teams.filter(t => t.password && t.password.trim() !== '')) {
        csvLines.push(`${team.teamId},"${(team.name || '').replace(/"/g, '""')}",${team.password}`);
    }
    // Teams we just updated
    for (const r of results) {
        csvLines.push(`${r.teamId},"${(r.name || '').replace(/"/g, '""')}",${r.password}`);
    }

    const csvPath = path.join(__dirname, '..', 'team_passwords.csv');
    fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf8');
    console.log(`📄 Password list saved to: ${csvPath}`);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
