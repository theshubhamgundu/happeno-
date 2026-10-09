import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const missing = [
  'TRI26005', 'TRI26009', 'TRI26037', 'TRI26043', 'TRI26048', 'TRI26050',
  'TRI26055', 'TRI26063', 'TRI26098', 'TRI26110', 'TRI26172', 'TRI26180',
  'TRI26191', 'TRI26208', 'TRI26236', 'TRI26255', 'TRI26259', 'TRI26260',
  'TRI26304', 'TRI26326', 'TRI26504', 'TRI26539', 'TRI26572',
  'TRI26586', 'TRI26620', 'TRI26652', 'TRI26660', 'TRI26682', 'TRI26688',
  'TRI26689', 'TRI26692', 'TRI26690', 'TRI26693', 'TRI26696', 'TRI26712'
];

async function run() {
    let allData = [];
    let page = 0;
    while(true) {
        const { data, error } = await supabase.from('registrations').select('*').range(page*1000, (page+1)*1000 - 1);
        if(error) throw error;
        if(data.length === 0) break;
        allData.push(...data);
        page++;
    }
    
    const validTeams = allData.filter(t => t.captain && t.team_id && missing.includes(t.team_id));
    console.log('Found ' + validTeams.length + ' missing teams to process.');

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

    let success = 0;
    let failed = 0;
    
    for (let i = 0; i < validTeams.length; i++) {
        const team = validTeams[i];
        
        const rawId = team.team_id.replace('TRI', '');
        const fName = team.captain.trim().split(' ')[0];
        const capName = fName.charAt(0).toUpperCase() + fName.slice(1).toLowerCase();
        const password = '@' + capName + rawId;
        
        let toEmails = [team.email];
        if (team.members && team.members.length > 0 && team.members[0].email) {
            toEmails.push(team.members[0].email);
        }
        toEmails = [...new Set(toEmails.map(e => e.toLowerCase().trim()))];

        const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Your Tricity Hackathon Credentials</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background-color: #0f172a; padding: 48px 40px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Welcome to TRI-CITY</h1>
            <p style="color: #94a3b8; margin: 12px 0 0 0; font-size: 16px;">Your gateway is now open.</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px;">
            <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #334155;">
                Hello <strong>${team.captain}</strong>,
            </p>
            
            <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 1.6; color: #334155;">
                Your team <strong>${team.team_name}</strong> has been successfully authorized. Your official dashboard is now live and ready for access. Please find your secure login credentials below.
            </p>

            <!-- Credentials Box -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; margin-bottom: 32px;">
                <div style="margin-bottom: 24px;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">Login ID</p>
                    <p style="margin: 0; font-size: 24px; font-weight: 700; color: #0f172a; font-family: monospace;">${team.team_id}</p>
                </div>
                <div>
                    <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">Password</p>
                    <p style="margin: 0; font-size: 24px; font-weight: 700; color: #0f172a; font-family: monospace;">${password}</p>
                </div>
            </div>

            <!-- Action Button -->
            <div style="text-align: center; margin-bottom: 40px;">
                <a href="https://tricity.centle.in/login" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-weight: 600; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-size: 16px;">Access Dashboard</a>
            </div>

            <!-- Footer Notes -->
            <div style="border-top: 1px solid #e2e8f0; padding-top: 32px;">
                <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #0f172a;">Next Steps:</h3>
                <ul style="margin: 0 0 24px 0; padding: 0 0 0 20px; font-size: 14px; line-height: 1.6; color: #475569;">
                    <li style="margin-bottom: 8px;">Log in immediately to confirm your access.</li>
                    <li style="margin-bottom: 8px;">Lock in your track and problem statement.</li>
                    <li style="margin-bottom: 8px;">Download entry passes for all team members.</li>
                </ul>

                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #94a3b8; text-align: center;">
                    For any support queries, please contact the organizing team.<br>
                    Tricity Hackathon 2024
                </p>
            </div>
        </div>
    </div>
</body>
</html>`;
        
        for (const email of toEmails) {
            try {
                await transporter.sendMail({
                    from: '"Tri-City Hackathon" <shubham@centle.in>',
                    to: email,
                    subject: 'Action Required: Your Tricity Hackathon Credentials',
                    html: htmlTemplate
                });
                success++;
                console.log('[' + (i+1) + '/' + validTeams.length + '] Sent to ' + email + ' (Team: ' + team.team_id + ')');
            } catch (e) {
                failed++;
                console.log('[' + (i+1) + '/' + validTeams.length + '] Failed sending to ' + email + ': ' + e.message);
            }
        }
    }
    console.log('DONE! Success: ' + success + ' Failed: ' + failed);
}
run();
