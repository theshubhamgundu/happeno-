import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const password = Math.random().toString(36).slice(-8);
  const password_hash = await bcrypt.hash(password, 12);
  
  const team = {
    transaction_id: crypto.randomUUID(),
    team_name: 'Buddineni Rakshith',
    team_id: 'TRI26726',
    password_hash,
    tech_stack: {},
    track_preferences: [],
    college: 'Kakatiya institute of technology and science warangal',
    captain: 'Buddineni Rakshith',
    captain_mobile: '8309870045',
    email: 'buddinenirakshith@example.com',
    entry_type: 'INDIVIDUAL',
    members: [{
      "email": "buddinenirakshith@example.com",
      "phone": "8309870045",
      "college": "Kakatiya institute of technology and science warangal",
      "is_lead": true,
      "fullName": "Buddineni Rakshith",
      "meal_pass": false,
      "checked_in": false,
      "department": "Unknown",
      "meal_redeemed": false,
      "participant_id": crypto.randomUUID(),
      "networking_pass": false,
      "networking_redeemed": false
    }],
    status: 'COMPLETED',
    meal_access: {"purchased_meals":[],"networking_passes":[]},
    room: 'Block-IV 3rd Floor', 
    created_at: new Date().toISOString(),
    raw_data: {}
  };

  const { data, error } = await supabase.from('registrations').insert(team).select();
  if (error) {
    console.error('Error inserting:', error);
  } else {
    console.log('Successfully added TRI26726!');
    console.log(`Login ID: TRI26726`);
    console.log(`Password: ${password}`);
  }
}

run();
