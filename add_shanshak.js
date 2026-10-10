require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('judges').select('generated_id').like('generated_id', 'TRJ-%').order('generated_id', { ascending: false }).limit(1);
  let nextId = 'TRJ-101';
  if (data && data.length > 0) {
    const lastNum = parseInt(data[0].generated_id.split('-')[1]);
    nextId = 'TRJ-' + (lastNum + 1);
  }
  
  const passwordRaw = '9977068486';
  const passwordHash = await bcrypt.hash(passwordRaw, 6);

  const newJudge = {
    generated_id: nextId,
    name: 'Shanshak',
    password_hash: passwordHash,
    specialization: 'All 7 Tracks'
  };

  const { data: insertData, error: insertError } = await supabase.from('judges').insert(newJudge).select();
  if (insertError) {
    console.error('Insert error:', insertError);
  } else {
    console.log('Successfully inserted:', insertData[0].generated_id, insertData[0].name);
    fs.appendFileSync('public/judges_login_details.csv', '\\n"Shanshak",'+nextId+',"9977068486"');
  }
}
run();
