
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const missing = [
  'TRI26005', 'TRI26009', 'TRI26037', 'TRI26043', 'TRI26048', 'TRI26050',
  'TRI26055', 'TRI26063', 'TRI26098', 'TRI26110', 'TRI26172', 'TRI26180',
  'TRI26191', 'TRI26208', 'TRI26236', 'TRI26255', 'TRI26259', 'TRI26260',
  'TRI26304', 'TRI26326', 'TRI26504', 'TRI26539', 'TRI26572',
  'TRI26586', 'TRI26620', 'TRI26652', 'TRI26660', 'TRI26682', 'TRI26688',
  'TRI26689', 'TRI26692', 'TRI26690', 'TRI26693', 'TRI26696', 'TRI26712'
];

async function insertMissing() {
    const csvContent = fs.readFileSync('agency_data.csv', 'utf8').split('\n');
    const teams = {};

    for (const line of csvContent) {
        if (!line.trim()) continue;
        const cols = line.split(',');
        const teamId = cols[0] ? cols[0].trim() : '';
        
        if (missing.includes(teamId)) {
            if (!teams[teamId]) {
                teams[teamId] = {
                    team_id: teamId,
                    transaction_id: teamId,
                    team_name: cols[1] ? cols[1].trim() : 'Unknown Team',
                    status: 'COMPLETED',
                    members: [],
                    raw_data: {
                        'College Name': cols[7] ? cols[7].trim() : '',
                        'Amount': cols[9] ? cols[9].trim() : '',
                        'Status': 'COMPLETED'
                    }
                };
            }
            
            const memberType = cols[2] ? cols[2].trim() : '';
            const fullName = cols[3] ? cols[3].trim() : '';
            const email = cols[4] ? cols[4].trim() : '';
            const phone = cols[5] ? cols[5].trim() : '';
            const dept = cols[6] ? cols[6].trim() : '';
            
            teams[teamId].members.push({
                fullName,
                email,
                phone,
                department: dept
            });
            
            if (memberType === 'Team Leader' || memberType === 'Solo') {
                teams[teamId].captain = fullName;
                teams[teamId].email = email;
            }
        }
    }

    const payload = Object.values(teams);
    console.log('Prepared ' + payload.length + ' teams for insertion.');
    
    for (const team of payload) {
        if (!team.captain && team.members.length > 0) {
            team.captain = team.members[0].fullName;
            team.email = team.members[0].email;
        }
    }

    const { data, error } = await supabase.from('registrations').insert(payload);
    
    if (error) {
        console.error('Insert Error:', error);
    } else {
        console.log('Successfully inserted ' + payload.length + ' teams.');
    }
}
insertMissing();

