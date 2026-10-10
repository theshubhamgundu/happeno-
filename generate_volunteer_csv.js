require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('volunteers').select('name, generated_id, phone, role').order('generated_id', { ascending: true });
  if (error) {
    console.error(error);
    return;
  }
  let csv = 'Name,Volunteer ID,Role,Password (Phone)\n';
  for (const row of data) {
    csv += `"${row.name}",${row.generated_id},"${row.role || ''}",${row.phone}\n`;
  }
  fs.writeFileSync('public/volunteers_login_details.csv', csv);
  console.log('Created public/volunteers_login_details.csv with ' + data.length + ' volunteers.');
}
run();
