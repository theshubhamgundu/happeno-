import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import readline from 'readline';

// Config
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const args = process.argv.slice(2);
const isDryRun = !args.includes('--execute');
const forceTeam = args.find(a => a.startsWith('--team='))?.split('=')[1];
const csvFile = args.find(a => !a.startsWith('--'));

if (!csvFile) {
    console.log('Usage: node scripts/03-import-agency-csv.mjs <csv-file> [--execute] [--team=TRI26XXX]');
    console.log('--execute: Run the import and save to the database. (Default is dry-run)');
    console.log('--team: Force run on a specific team, bypassing addons_imported checks.');
    process.exit(1);
}

if (isDryRun) {
    console.log('DRY RUN: No changes will be saved to the database. Add --execute to apply changes.');
} else {
    console.log('REAL RUN: Changes WILL be saved to the database! Ensure you have a backup.');
}

async function run() {
    const fileStream = fs.createReadStream(csvFile);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let headers = [];
    let isFirst = true;

    for await (const line of rl) {
        if (!line.trim()) continue;
        const columns = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));

        if (isFirst) {
            headers = columns.map(h => h.toLowerCase());
            isFirst = false;
            continue;
        }

        const row = {};
        headers.forEach((h, i) => { row[h] = columns[i]; });

        const teamId = row['team id'] || row['team_id'] || row['teamid'];
        const mealPasses = parseInt(row['meal passes'] || row['meal'] || '0', 10);
        const networkingPasses = parseInt(row['networking passes'] || row['networking'] || '0', 10);

        if (!teamId) continue;
        if (forceTeam && teamId !== forceTeam) continue;

        const hasMeal = mealPasses > 0;
        const hasNetworking = networkingPasses > 0;

        if (!hasMeal && !hasNetworking) continue;

        // Fetch team
        const { data: team, error } = await supabase
            .from('registrations')
            .select('team_id, status, raw_data, members')
            .eq('team_id', teamId)
            .maybeSingle();

        if (error || !team) {
            console.log(`[SKIP] Team ${teamId} not found in database.`);
            continue;
        }
        
        // Block re-imports unless forced
        if (!forceTeam && team.raw_data && team.raw_data.addons_imported) {
            console.log(`[SKIP] Team ${teamId} was already imported. Use --team=${teamId} to force.`);
            continue;
        }

        let targetTeam = team;

        // Follow merge pointer if needed
        if (team.status === 'MERGED' && team.raw_data && team.raw_data.merged_into_team_id) {
            const { data: mergedTeam } = await supabase
                .from('registrations')
                .select('team_id, members, raw_data')
                .eq('team_id', team.raw_data.merged_into_team_id)
                .maybeSingle();
            
            if (mergedTeam) {
                targetTeam = mergedTeam;
                console.log(`[FOLLOW] Team ${teamId} was merged into ${mergedTeam.team_id}`);
                
                if (!forceTeam && mergedTeam.raw_data && mergedTeam.raw_data.addons_imported) {
                    console.log(`[SKIP] Merged Team ${mergedTeam.team_id} was already imported.`);
                    continue;
                }
            }
        }

        // Apply passes to members matching the original team emails
        const originalEmails = new Set((team.members || []).map(m => m.email.toLowerCase()));

        let needsUpdate = false;
        const newMembers = (targetTeam.members || []).map(m => {
            const isOriginalMember = originalEmails.has(m.email.toLowerCase());
            if (isOriginalMember) {
                let updated = { ...m };
                if (hasMeal && !m.meal_pass) {
                    updated.meal_pass = true;
                    needsUpdate = true;
                }
                if (hasNetworking && !m.networking_pass) {
                    updated.networking_pass = true;
                    needsUpdate = true;
                }
                return updated;
            }
            return m;
        });

        if (needsUpdate || forceTeam) {
            console.log(`[UPDATE] Team ${targetTeam.team_id}: setting meal=${hasMeal}, networking=${hasNetworking} for ${originalEmails.size} members.`);
            
            if (!isDryRun) {
                const updatedRawData = { ...targetTeam.raw_data, addons_imported: true };
                const { error: updateError } = await supabase
                    .from('registrations')
                    .update({ members: newMembers, raw_data: updatedRawData })
                    .eq('team_id', targetTeam.team_id);
                
                if (updateError) {
                    console.error(`Failed to update ${targetTeam.team_id}:`, updateError);
                }
            }
        }
    }
}

run();
