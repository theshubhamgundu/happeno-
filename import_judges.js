require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const workbook = xlsx.readFile('C:\\Users\\gkaru\\Downloads\\evaluators_list.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);
  
  let currentId = 101;
  const inserts = [];

  for (const row of rows) {
    const name = row['Name'];
    const contact = String(row['Contact']).trim();
    if (!name || !contact) continue;

    const generated_id = `TCJ-${currentId++}`;
    const password_hash = await bcrypt.hash(contact, 6);

    inserts.push({
      generated_id,
      name,
      password_hash,
      specialization: 'General'
    });
  }

  const { data, error } = await supabase.from('judges').insert(inserts).select();
  
  if (error) {
    console.error('Error inserting judges:', error);
  } else {
    console.log(`Successfully imported ${data.length} judges!`);
    console.log(`The first judge is ${data[0].generated_id} (${data[0].name})`);
  }
}

run();
