import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// CONFIGURE SMTP FROM .env.local
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Helper for pacing the emails
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function sendEmails() {
  console.log('Fetching active teams...');
  const { data, error } = await supabase.from('registrations').select('team_id, captain, email, members');
  
  if (error) {
    console.error('Error fetching data:', error);
    return;
  }

  const validTeams = data.filter(t => t.captain && t.team_id && (["mdfayazuddinofficial@gmail.com","sriswathvik926@gmail.com","sreejarayabharapu@gmail.com","vignyathriirukulla156@gmail.com","padmasrikandukuri@gmail.com","b25ai115@kitsw.ac.in","harshalakkarsu1418@gmail.com","hepsiba348@gmail.com","sirumallasaisrikaran@gmail.com","thaneerusiddhardha@gmail.com","b24ds087@kitsw.ac.in","b26ds164@kitsw.ac.in","b24ec064@kitsw.ac.in","renitha.diddi@gmail.com","rakeshr0719@gmail.com","geethuuu43@gmail.com","pulugumadhumitha@gmail.com","rudra.sohan@gmail.com","aksharganji23@gmail.com","nishathsarah@gmail.com","b25ai197l@kitsw.ac.in","b26in069l@kitsw.ac.in","ruhinathalwar@gmail.com","mvardhan2006@gmail.com","ayesha.saboor.in@gmail.com","aashrithasaraswathibatla@gmail.com","vajradevan@gmail.com","mustaneer95@gmail.com","vvsvaranasi1@gmail.com","b25ec041@kitsw.ac.in","b24it012@kitsw.ac.in","varikuppalasaikumar5@gmail.com","khanzziakhan8907@gmail.com","akshayareddynathadi@gmail.com","prunithkannam@gmail.com","b24ai032@kitsw.ac.in","chillavennela25@gmail.com","saamiyanaaz74746@gmail.com","arukaalaharshithpatel@gmail.com","mendeprudvik933@gmail.com","likhithakummari25@gmail.com","kjeevanakala@gmail.com","tejaswimergu@gmail.com","chaithanyapatel114@gmail.com","chvishwat@gmail.com","suprathika2008@gmail.com","lakshmiprasadsoma974@gmail.com","b25cs295@kitsw.ac.in","ysirishchandra@gmail.com","varshinidhanda@gmail.com","adityasirikonda42@gmail.com","kotagirirakshitha11@gmail.com","ragulaarjun07@gmail.com","ashwinipratapure09@gmail.com","siripasunuti.07@gmail.com","alliabhigna19@gmail.com","gamerthriv@gmail.com","aravindpayyavula90@gmail.com","anumula.srivinya@gmail.com","bheemavarapuhasini@gmail.com","anirudhapeddi@gmail.com"].includes(t.email) || (t.members && t.members[0] && ["mdfayazuddinofficial@gmail.com","sriswathvik926@gmail.com","sreejarayabharapu@gmail.com","vignyathriirukulla156@gmail.com","padmasrikandukuri@gmail.com","b25ai115@kitsw.ac.in","harshalakkarsu1418@gmail.com","hepsiba348@gmail.com","sirumallasaisrikaran@gmail.com","thaneerusiddhardha@gmail.com","b24ds087@kitsw.ac.in","b26ds164@kitsw.ac.in","b24ec064@kitsw.ac.in","renitha.diddi@gmail.com","rakeshr0719@gmail.com","geethuuu43@gmail.com","pulugumadhumitha@gmail.com","rudra.sohan@gmail.com","aksharganji23@gmail.com","nishathsarah@gmail.com","b25ai197l@kitsw.ac.in","b26in069l@kitsw.ac.in","ruhinathalwar@gmail.com","mvardhan2006@gmail.com","ayesha.saboor.in@gmail.com","aashrithasaraswathibatla@gmail.com","vajradevan@gmail.com","mustaneer95@gmail.com","vvsvaranasi1@gmail.com","b25ec041@kitsw.ac.in","b24it012@kitsw.ac.in","varikuppalasaikumar5@gmail.com","khanzziakhan8907@gmail.com","akshayareddynathadi@gmail.com","prunithkannam@gmail.com","b24ai032@kitsw.ac.in","chillavennela25@gmail.com","saamiyanaaz74746@gmail.com","arukaalaharshithpatel@gmail.com","mendeprudvik933@gmail.com","likhithakummari25@gmail.com","kjeevanakala@gmail.com","tejaswimergu@gmail.com","chaithanyapatel114@gmail.com","chvishwat@gmail.com","suprathika2008@gmail.com","lakshmiprasadsoma974@gmail.com","b25cs295@kitsw.ac.in","ysirishchandra@gmail.com","varshinidhanda@gmail.com","adityasirikonda42@gmail.com","kotagirirakshitha11@gmail.com","ragulaarjun07@gmail.com","ashwinipratapure09@gmail.com","siripasunuti.07@gmail.com","alliabhigna19@gmail.com","gamerthriv@gmail.com","aravindpayyavula90@gmail.com","anumula.srivinya@gmail.com","bheemavarapuhasini@gmail.com","anirudhapeddi@gmail.com"].includes(t.members[0].email))));
  console.log(`Found ${validTeams.length} valid teams to process.`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < validTeams.length; i++) {
    const team = validTeams[i];
    
    // Priority: Updated email from members array, fallback to root email
    const targetEmail = (team.members && team.members[0] && team.members[0].email) 
      ? team.members[0].email 
      : team.email;

    if (!targetEmail) {
      console.log(`⚠️ Skipping ${team.team_id} - No email found.`);
      continue;
    }

    // EXACT BACKEND PASSWORD LOGIC
    const captainFullName = team.captain || '';
    const nameParts = captainFullName.split(/[\s.]+/).map(p => p.replace(/[^a-zA-Z]/g, '')).filter(Boolean);
    const firstName = nameParts.find(p => p.length > 1) || nameParts[0] || '';
    const fiveDigitCode = team.team_id.replace(/[^0-9]/g, '');
    const generatedPassword = `@${firstName}${fiveDigitCode}`;

    const mailOptions = {
      from: `"Tricity AI Hackathon" <${process.env.SMTP_USER}>`,
      to: targetEmail,
      subject: '🚀 Welcome to Tricity AI Hackathon 2026! Your Credentials & Entry Passes Inside',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2563eb;">Hi ${firstName},</h2>
          <p>The wait is over! We are absolutely thrilled to welcome you to the <strong>Tricity AI Hackathon 2026</strong>. Get ready for an incredible weekend of building, innovating, and competing.</p>
          <p>Below is your official login information. <strong>As the primary contact, you are responsible for managing your dashboard and downloading entry passes.</strong></p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">🔑 Your Dashboard Credentials</h3>
            <p>You will use the Participant Dashboard to submit your project, view the live schedule, and request mentor assistance during the hackathon.</p>
            <ul style="list-style-type: none; padding-left: 0;">
              <li><strong>Registration ID:</strong> <code>${team.team_id}</code></li>
              <li><strong>Password:</strong> <code>${generatedPassword}</code></li>
            </ul>
            <p style="font-size: 12px; color: #6b7280;"><em>Note: Please keep this password secure and do not share it. You will manage the dashboard on behalf of your team.</em></p>
          </div>
          <h3 style="color: #1f2937;">🎟️ Download Your Entry Passes</h3>
          <p>To enter the venue, you must have your official passes.</p>
          <ol>
            <li>Log in to the dashboard using the credentials above.</li>
            <li>Navigate to the <strong>Passes</strong> section.</li>
            <li>Download your entry pass.</li>
            <li><strong>If you have a team</strong>, you must also download your teammates' passes and send them directly to them so they can enter the venue.</li>
          </ol>
          <h3 style="color: #1f2937;">💬 Need Help?</h3>
          <p>If you have any technical issues accessing your dashboard, please reach out to the organizing team or ask at the help desk.</p>
          <p>Get some rest, charge your laptops, and we’ll see you at the starting line!</p>
          <p>Best regards,<br/><strong>The Tricity AI Hackathon Organizing Team</strong></p>
        </div>
      `
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`[${i + 1}/${validTeams.length}] ✅ Sent to ${targetEmail} (Team: ${team.team_id})`);
      successCount++;
    } catch (err) {
      console.error(`[${i + 1}/${validTeams.length}] ❌ Failed sending to ${targetEmail}:`, err.message);
      failCount++;
    }

    // Small delay to prevent SMTP rate-limiting
    await delay(300);
  }

  console.log(`\n🎉 DONE! Successfully sent: ${successCount} | Failed: ${failCount}`);
}

sendEmails();
