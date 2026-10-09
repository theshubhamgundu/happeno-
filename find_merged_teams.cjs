
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

async function checkMerged() {
    let allData = [];
    let page = 0;
    while(true) {
        const { data, error } = await supabase.from('registrations').select('*').range(page*1000, (page+1)*1000 - 1);
        if(error) throw error;
        if(data.length === 0) break;
        allData.push(...data);
        page++;
    }

    const newTeams = allData.filter(t => missing.includes(t.team_id));
    const olderTeams = allData.filter(t => !missing.includes(t.team_id));

    let overlaps = [];

    for (const nt of newTeams) {
        let ntEmails = new Set(nt.members.map(m => m.email?.toLowerCase().trim()).filter(Boolean));
        let ntPhones = new Set(nt.members.map(m => m.phone?.trim()).filter(Boolean));

        for (const ot of olderTeams) {
            let otEmails = ot.members.map(m => m.email?.toLowerCase().trim()).filter(Boolean);
            let otPhones = ot.members.map(m => m.phone?.trim()).filter(Boolean);

            let hasOverlap = false;
            let overlapReason = [];

            for (const em of otEmails) {
                if (ntEmails.has(em)) {
                    hasOverlap = true;
                    overlapReason.push('Email: ' + em);
                }
            }
            for (const ph of otPhones) {
                if (ntPhones.has(ph)) {
                    hasOverlap = true;
                    overlapReason.push('Phone: ' + ph);
                }
            }

            if (hasOverlap) {
                overlaps.push({
                    newTeam: nt.team_id,
                    newTeamName: nt.team_name,
                    olderTeam: ot.team_id,
                    olderTeamName: ot.team_name,
                    reason: [...new Set(overlapReason)].join(', ')
                });
            }
        }
    }

    console.log('Found ' + overlaps.length + ' overlapping cases:');
    overlaps.forEach(o => {
        console.log('- ' + o.newTeam + ' (' + o.newTeamName + ') overlaps with ' + o.olderTeam + ' (' + o.olderTeamName + ') via [' + o.reason + ']');
    });
}
checkMerged();

