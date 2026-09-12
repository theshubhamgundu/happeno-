import { Resend } from 'resend';
import QRCode from 'qrcode';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

// Resend initialized inside functions

/**
 * Generates a official ticket image by overlaying a QR code and team details
 * onto the provided ticket template.
 */
export const generateTicketImage = async (teamData: any) => {
    const { teamId, team, transactionId } = teamData;
    const templatePath = path.join(process.cwd(), 'public', 'ticket-template.png');

    if (!fs.existsSync(templatePath)) {
        console.error('Ticket template not found at:', templatePath);
        return null;
    }

    try {
        // 1. Generate QR Code as Buffer - INCREASED SIZE
        const qrCodeData = JSON.stringify({ teamId, team, transactionId });
        const qrBuffer = await QRCode.toBuffer(qrCodeData, {
            margin: 1,
            width: 440, // Expanded for impact
            color: { dark: '#13001F', light: '#FFFFFF' }
        });

        // 2. Create Text Overlay (Team & Reg Details) - LARGE FONTS
        const textSvg = Buffer.from(`
            <svg width="550" height="200" xmlns="http://www.w3.org/2000/svg">
                <style>
                    .label { font-family: sans-serif; font-size: 30px; font-weight: bold; fill: #13001F; text-transform: uppercase; letter-spacing: 4px; }
                    .value { font-family: monospace; font-size: 42px; font-weight: 900; fill: #62009B; }
                    .small { font-family: monospace; font-size: 18px; fill: #888; }
                </style>
                <text x="275" y="45" text-anchor="middle" class="label">TEAM ID</text>
                <text x="275" y="95" text-anchor="middle" class="value">${teamId}</text>
                <text x="275" y="145" text-anchor="middle" class="label" style="font-size: 22px; fill: #444;">REGISTRATION ID</text>
                <text x="275" y="180" text-anchor="middle" class="small">${transactionId}</text>
            </svg>
        `);

        // 3. (Logo removed as per request)
        const logoOverlay = null;


        // 4. Composite everything - Optimized for the white stub
        const composites: any[] = [
            {
                input: qrBuffer,
                top: 25,
                left: 1545 // Moved RIGHT by 70px (approx 0.5 inch at template scale)
            },
            {
                input: textSvg,
                top: 450,
                left: 1420
            }
        ];

        if (logoOverlay) {
            composites.push({
                input: logoOverlay,
                top: 50,
                left: 50
            });
        }

        const ticketBuffer = await sharp(templatePath)
            .composite(composites)
            .png()
            .toBuffer();

        return ticketBuffer;
    } catch (err) {
        console.error('Error generating official ticket:', err);
        return null;
    }
};

export const sendConfirmationEmails = async (teamData: any) => {
    // Initialize Resend with API Key inside the function
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { teamId, team, members, captain, track, transactionId } = teamData;

    // Normalize members to always be objects
    const normalizedMembers = members.map((m: any) => {
        if (typeof m === 'string') {
            return {
                fullName: m,
                email: teamData.members[0].email || '', // Fallback for legacy
                phone: teamData.captainMobile || ''
            };
        }
        return m;
    });

    const leader = normalizedMembers[0];

    // Generate the professional ticket with overlays
    const ticketBuffer = await generateTicketImage(teamData);

    // Resend from address (Verified domain)
    const fromAddress = 'TRI-CITY AI HACKATHON <admin@tricity.online>';


    // Leader Email - PROFESSIONAL CORPORATE THEME
    const leaderEmailHtml = `
        <div style="background-color: #f8fafc; margin: 0; padding: 40px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                
                <!-- Professional Header -->
                <div style="background: #ffffff; padding: 32px; text-align: center; border-bottom: 1px solid #f1f5f9;">
                    <div style="font-size: 28px; font-weight: 900; color: #62009B; italic: oblique; margin-bottom: 8px;">TRI-CITY AI HACKATHON</div>
                    <div style="color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">JOIN OUR COMMUNITY</div>
                    <div style="margin-top: 5px;"><a href="https://chat.whatsapp.com/J5Cqelh3gVPLalKt9FEqPp?mode=gi_t" style="color: #25d366; font-weight: bold; text-decoration: none; font-size: 12px;">Official WhatsApp Group</a></div>
                </div>

                <div style="padding: 40px;">
                    <h1 style="color: #0f172a; font-size: 24px; font-weight: 800; margin: 0 0 16px 0; letter-spacing: -0.025em;">Registration Confirmed</h1>
                    <p style="font-size: 16px; color: #475569; margin: 0;">Dear <b>${leader.fullName}</b>,</p>
                    <p style="font-size: 16px; color: #475569; margin: 12px 0 0 0;">Congratulations! Your team registration for <b>TRI-CITY AI HACKATHON</b> has been successfully processed. We are excited to have you join us at Centle India for this 24-hour innovation journey.</p>
                    
                    <!-- Event Details Block -->
                    <div style="margin: 32px 0; background: #f1f5f9; border-radius: 12px; padding: 24px;">
                        <h3 style="color: #0f172a; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">Event Information</h3>
                        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                            <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color: #64748b;">Event Dates</td><td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0f172a;">27-28 February, 2026</td></tr>
                            <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color: #64748b;">Community</td><td style="padding: 8px 0; text-align: right; font-weight: 600; color: #25d366;"><a href="https://chat.whatsapp.com/J5Cqelh3gVPLalKt9FEqPp?mode=gi_t" style="color: #25d366; text-decoration: none;">Join WhatsApp Group</a></td></tr>
                            <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color: #64748b;">Team Name</td><td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0f172a;">${team}</td></tr>
                            <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color: #64748b;">Project Track</td><td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0f172a;">${track}</td></tr>
                            <tr><td style="padding: 8px 0; color: #64748b;">Team ID</td><td style="padding: 8px 0; text-align: right; font-family: monospace; font-weight: 700; color: #2563eb;">${teamId}</td></tr>
                        </table>
                    </div>

                    <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 24px; text-align: center;">
                        <h4 style="margin: 0 0 8px 0; color: #1e40af; font-size: 16px;">Digital Entry Ticket Attached</h4>
                        <p style="margin: 0 0 20px 0; color: #60a5fa; font-size: 13px;">Please find your official entry pass attached to this email. You will need to present this at the venue for check-in.</p>
                        <div style="display: inline-block; padding: 12px 24px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">View Participant Portal</div>
                    </div>
                </div>
                
                <div style="background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9;">
                    <p style="margin: 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">TRI-CITY AI HACKATHON | Centle India</p>
                    <p style="margin: 4px 0 0 0; font-size: 11px; color: #cbd5e1;"><a href="https://chat.whatsapp.com/J5Cqelh3gVPLalKt9FEqPp?mode=gi_t" style="color: #cbd5e1; text-decoration: none;">Join the WhatsApp Community for Live Updates</a></p>
                </div>
            </div>
        </div>
    `;

    // Member Email - PROFESSIONAL CORPORATE THEME
    const memberEmailHtml = (memberName: string) => `
        <div style="background-color: #f8fafc; margin: 0; padding: 40px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                <div style="background: #ffffff; padding: 32px; text-align: center; border-bottom: 1px solid #f1f5f9;">
                    <div style="font-size: 24px; font-weight: 900; color: #62009B; italic: oblique;">TRI-CITY AI HACKATHON</div>
                </div>
                <div style="padding: 40px;">
                    <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 20px;">Welcome to TRI-CITY AI HACKATHON</h2>
                    <p style="color: #475569; font-size: 16px;">Hi <b>${memberName}</b>,</p>
                    <p style="color: #475569; font-size: 16px; margin: 12px 0 0 0;">You have been successfully registered as a member of Team <b>${team}</b> for the upcoming hackathon.</p>
                    
                    <div style="margin: 32px 0; padding: 24px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                        <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Event Details</p>
                        <p style="margin: 12px 0 0 0; font-size: 14px;"><b>Date:</b> 27-28 February, 2026</p>
                        <p style="margin: 4px 0 0 0; font-size: 13px;"><b>Venue:</b> Centle India (Centle India), near Ramoji film city, Deshmuki Village, Yadadri, Bhuvanagiri, Telangana 508284</p>
                        <p style="margin: 12px 0 0 0; font-size: 14px;"><b>Team ID:</b> ${teamId}</p>
                    </div>

                    <p style="color: #64748b; font-size: 13px;">Your team lead (<b>${leader.fullName}</b>) has been issued the official digital entry ticket for the entire team.</p>
                </div>
                <div style="background: #f8fafc; padding: 24px; text-align: center; font-size: 11px; color: #94a3b8;">
                    <p>TRI-CITY AI HACKATHON @ Centle India</p>
                </div>
            </div>
        </div>
    `;

    try {
        const commonAttachments: any[] = [];


        // Send Leader Email with Attachments
        await resend.emails.send({
            from: fromAddress,
            to: leader.email,
            subject: `ðŸ”’ REGISTRATION SYNCED: Team ${team} | TRI-CITY AI HACKATHON`,
            html: leaderEmailHtml,
            attachments: [
                ...commonAttachments,
                ...(ticketBuffer ? [{
                    filename: `tricity_Ticket_${teamId}.png`,
                    content: ticketBuffer,
                }] : [])
            ]
        });
        console.log(`âœ… Premium ticket email sent to leader: ${leader.email}`);

        // Send Member Emails
        for (const member of normalizedMembers.slice(1)) {
            if (!member.email) continue;

            await resend.emails.send({
                from: fromAddress,
                to: member.email,
                subject: `ðŸ‘¾ ACCESS GRANTED: Welcome to Team ${team} | TRI-CITY AI HACKATHON`,
                html: memberEmailHtml(member.fullName),
                attachments: commonAttachments
            });
            console.log(`âœ… Premium welcome email sent to: ${member.email}`);
        }
    } catch (error) {
        console.error('âŒ Resend delivery failed:', error);
    }
};
