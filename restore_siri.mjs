import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const team = {
    transaction_id: '75475866-d306-4b3c-b2bb-a27c9c86b571',
    team_name: 'Siri',
    team_id: 'TRI26172',
    password_hash: '$2b$12$S8yBwVUR.SUiBGzX.DcireVZSHMUXdlIrLo4lUVXfY1xbZf.kF/DC',
    tech_stack: {},
    track_preferences: [],
    college: 'SVS',
    captain: 'Battula vaishnitha',
    captain_mobile: '8309940272',
    email: 'vaishnitha34@gmail.com',
    entry_type: 'DUO',
    members: [{"email":"vaishnitha34@gmail.com","phone":"8309940272","college":"SVS","is_lead":true,"fullName":"Battula vaishnitha","meal_pass":false,"checked_in":false,"department":"EEE","meal_redeemed":false,"participant_id":"f524595a-3495-4d82-8586-6fd2feb2247a","networking_pass":false,"networking_redeemed":false},{"email":"siric7660@gmail.com","phone":"9885953393","college":"SVS","is_lead":false,"fullName":"Nanneboina siri chandana","meal_pass":false,"checked_in":false,"department":"CSD","meal_redeemed":false,"participant_id":"15198204-ca7d-4e3c-9807-e7a0d03a26e8","networking_pass":false,"networking_redeemed":false}],
    status: 'COMPLETED',
    meal_access: {"purchased_meals":[],"networking_passes":[]},
    room: 'Block-IV 3rd Floor', 
    created_at: '2026-10-05T05:55:37.983Z',
    raw_data: {}
  };

  const { data, error } = await supabase.from('registrations').insert(team).select();
  if (error) {
    console.error('Error inserting:', error);
  } else {
    console.log('Successfully restored TRI26172:', data[0].team_id, data[0].team_name);
  }
}

run();
