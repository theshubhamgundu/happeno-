
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fix() {
    const { data: team136 } = await supabase.from('registrations').select('*').eq('team_id', 'TRI26136').single();
    const { data: team137 } = await supabase.from('registrations').select('*').eq('team_id', 'TRI26137').single();
    
    if (!team136 || !team137) {
        console.error('Teams not found');
        return;
    }
    
    const rogueMemberIndex = team136.members.findIndex(m => m.fullName.includes('Member 2') || m.email.includes('SINGIREDDY'));
    if (rogueMemberIndex === -1) {
        console.error('Rogue member not found in 136');
        return;
    }
    
    const rogueMember = team136.members[rogueMemberIndex];
    
    // Remove from 136
    const new136Members = [...team136.members];
    new136Members.splice(rogueMemberIndex, 1);
    
    // Fix rogue member's messy data from CSV shift
    rogueMember.fullName = 'SINGIREDDY SUSHMITHA';
    rogueMember.email = 'singireddysushmithareddy104@mai.com';
    rogueMember.phone = '9989942085';
    rogueMember.college = 'KAMALA INSTITUTE OF TECHNOLOGY AND SCIENCE';
    rogueMember.department = 'Computer science';
    
    // Add to 137
    const new137Members = [...team137.members];
    new137Members.splice(1, 0, rogueMember);
    
    // Update 136
    await supabase.from('registrations').update({ members: new136Members }).eq('team_id', 'TRI26136');
    // Update 137
    await supabase.from('registrations').update({ members: new137Members }).eq('team_id', 'TRI26137');
    
    console.log('Fixed! Moved Sushmitha from TRI26136 to TRI26137');
}
fix();

