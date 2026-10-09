const fs = require('fs');
require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

const deletedIds = [
  'TRI26005', 'TRI26009', 'TRI26037', 'TRI26043', 'TRI26048', 'TRI26050',
  'TRI26055', 'TRI26063', 'TRI26098', 'TRI26110', 'TRI26172', 'TRI26180',
  'TRI26191', 'TRI26208', 'TRI26236', 'TRI26255', 'TRI26259', 'TRI26260',
  'TRI26304', 'TRI26326', 'TRI26504', 'TRI26539', 'TRI26572', 'TRI26586', 
  'TRI26620', 'TRI26652', 'TRI26660', 'TRI26688', 'TRI26689', 'TRI26692', 
  'TRI26690', 'TRI26693', 'TRI26696', 'TRI26712'
];

async function run() {
    const csvContent = fs.readFileSync('agency_data.csv', 'utf8').split('\n');
    const targetEmails = new Set();
    
    for (const line of csvContent) {
        if (!line.trim()) continue;
        const cols = line.split(',');
        const teamId = cols[0] ? cols[0].trim() : '';
        const email = cols[4] ? cols[4].trim().toLowerCase() : '';
        if (deletedIds.includes(teamId) && email) {
            targetEmails.add(email);
        }
    }

    const emailsToContact = Array.from(targetEmails);
    console.log('Found ' + emailsToContact.length + ' emails to contact.');

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
</head>
<body style="margin: 0; padding: 0; font-family: sans-serif; background-color: #f8fafc; color: #0f172a;">
    <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; padding: 40px;">
        <h2 style="margin: 0 0 20px 0; color: #0f172a;">Clarification: Your Team Merge was Successful!</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
            Hi there,
        </p>
        <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
            You may have just received an automated system email containing login credentials for your old individual/solo ID. <strong>Please disregard that previous email.</strong>
        </p>
        <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
            We are emailing you to confirm that the merge request you submitted during the <strong>Edit &amp; Merge Window</strong> was successfully processed. You have been properly merged into your new team.
        </p>
        <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
            Because you are safely merged into a team, you do not need to log in yourself. Your <strong>Team Leader</strong> has received the valid dashboard login credentials and will handle locking your track and downloading the entry passes for everyone on your team.
        </p>
        <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
            Sit back and relax. See you at the hackathon!
        </p>
        <p style="font-size: 14px; color: #94a3b8; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            Tri-City Hackathon Organizing Team
        </p>
    </div>
</body>
</html>
`;

    let success = 0;
    let failed = 0;
    
    for (let i = 0; i < emailsToContact.length; i++) {
        const email = emailsToContact[i];
        try {
            await transporter.sendMail({
                from: '"Tri-City Hackathon" <shubham@centle.in>',
                to: email,
                subject: 'Clarification: Your Team Merge was Successful',
                html: htmlTemplate
            });
            success++;
            console.log('[' + (i+1) + '/' + emailsToContact.length + '] Sent to ' + email);
        } catch (e) {
            failed++;
            console.log('[' + (i+1) + '/' + emailsToContact.length + '] Failed ' + email + ': ' + e.message);
        }
    }
    console.log('DONE! Success: ' + success + ' Failed: ' + failed);
}
run();
