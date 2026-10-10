require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const passwordRaw = '1234567890';
  const passwordHash = await bcrypt.hash(passwordRaw, 6);
  const ids = ['TRJ-104', 'TRJ-105', 'TRJ-106', 'TRJ-107', 'TRJ-108'];

  const { error } = await supabase.from('judges')
    .update({ password_hash: passwordHash })
    .in('generated_id', ids);

  if (error) {
    console.error('Update error:', error);
  } else {
    console.log('Successfully updated passwords in database.');
    
    // Update the CSV file
    let content = fs.readFileSync('public/judges_login_details.csv', 'utf8');
    content = content.replace(/"12345678"/g, `"${passwordRaw}"`);
    fs.writeFileSync('public/judges_login_details.csv', content);
    console.log('Updated CSV.');
  }
}
run();
