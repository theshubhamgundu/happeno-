require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('judges').select('generated_id, name, specialization').order('generated_id', { ascending: true });
  if (error) {
    console.error(error);
    return;
  }
  let csv = 'Judge ID,Name,Specialization,Password\n';
  for (const row of data) {
    csv += `${row.generated_id},"${row.name}","${row.specialization}",[Their Mobile Number]\n`;
  }
  fs.writeFileSync('judge_credentials.csv', csv);
  console.log('Exported ' + data.length + ' judges to judge_credentials.csv');
}
run();
