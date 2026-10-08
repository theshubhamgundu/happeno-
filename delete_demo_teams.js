const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Deleting demo teams...");
  
  const { data, error } = await supabase
    .from('registrations')
    .delete()
    .like('team_id', 'DEMO-TEAM-%');
    
  if (error) {
    console.error("Error deleting:", error);
  } else {
    console.log("Deleted demo teams successfully.");
  }
}

run();
