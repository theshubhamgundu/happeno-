import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    console.log('Fetching registrations...');
    const { data: teams, error } = await supabase.from('registrations').select('team_id, members, raw_data');
    if (error) {
        console.error('Error fetching registrations:', error);
        return;
    }

    let updatedCount = 0;

    for (const team of teams) {
        let needsUpdate = false;
        const newMembers = (team.members || []).map((m, idx) => {
            if (!m.participant_id) {
                needsUpdate = true;
                return {
                    ...m,
                    participant_id: randomUUID(),
                    is_lead: idx === 0,
                    meal_pass: false,
                    networking_pass: false,
                    meal_redeemed: false,
                    networking_redeemed: false,
                    checked_in: false
                };
            }
            return m;
        });

        if (needsUpdate) {
            console.log(`Updating team ${team.team_id}...`);
            const { error: updateError } = await supabase
                .from('registrations')
                .update({ members: newMembers })
                .eq('team_id', team.team_id);
            if (updateError) {
                console.error(`Failed to update ${team.team_id}:`, updateError);
            } else {
                updatedCount++;
            }
        }
    }

    console.log(`Migration complete. Updated ${updatedCount} teams.`);
}

migrate();
