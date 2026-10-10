import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const team = {
    transaction_id: '461e26b0-ae27-4302-a4cf-96d55759506d',
    team_name: 'Mech Nova',
    team_id: 'TRI26660',
    password_hash: '$2b$12$f3IGFyWbe3505HsllcdPyOXA.hUmwYaiiYQChKIWoQrJGSZ0Hzspi',
    tech_stack: {},
    track_preferences: [],
    college: 'Sr university',
    captain: 'Pakidde siddhartha',
    captain_mobile: '9391359035',
    email: 'siddharthapakide202@gmail.com',
    entry_type: 'DUO',
    members: [{"email":"siddharthapakide202@gmail.com","phone":"9391359035","college":"Sr university","is_lead":true,"fullName":"Pakidde siddhartha","meal_pass":false,"checked_in":false,"department":"Mechanical","meal_redeemed":false,"participant_id":"d3c3f9fa-1db7-43df-bbd5-29bfd82cc1fe","networking_pass":false,"networking_redeemed":false},{"email":"burgularamyasri9@gmail.com","phone":"9959292351","college":"Kits warangal","is_lead":false,"fullName":"Burgula Rajeshwari","meal_pass":false,"checked_in":false,"department":"Ai/Ml","meal_redeemed":false,"participant_id":"6eec95fc-25e3-433e-a781-d85d61c1f70e","networking_pass":false,"networking_redeemed":false}],
    status: 'COMPLETED',
    meal_access: {"purchased_meals":[],"networking_passes":[]},
    room: 'Block-IV 3rd Floor', 
    created_at: '2026-10-05T05:59:20.615Z',
    raw_data: {}
  };

  const { data, error } = await supabase.from('registrations').insert(team).select();
  if (error) {
    console.error('Error inserting:', error);
  } else {
    console.log('Successfully restored TRI26660:', data[0].team_id, data[0].team_name);
  }
}

run();
