import { teamSupabase as supabase } from './supabase';
import { Resend } from 'resend';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export async function verifyAndSendTicket(transactionId: string) {
    try {
        console.log(`ðŸš€ Automated verification for: ${transactionId}`);

        // 1. Update Status to COMPLETED
        const { data: registration, error: sbError } = await supabase
            .from('registrations')
            .update({ status: 'COMPLETED' })
            .eq('transaction_id', transactionId)
            .select()
            .single();

        if (sbError || !registration) {
            console.error("âŒ Supabase Update Error:", sbError || "No registration found");
            return { success: false, message: "Registration not found" };
        }

        console.log(`âœ… Registration found for team: ${registration.team_name}`);

        // 2. Extract Captain's Email
        let captainEmail = registration.email || registration.captain_email || "";

        if (!captainEmail) {
            console.log("ðŸ” Email missing from main column, checking members array...");
            try {
                const members = typeof registration.members === 'string'
                    ? JSON.parse(registration.members)
                    : registration.members;

                if (Array.isArray(members) && members.length > 0) {
                    captainEmail = members[0].email || members[0].Email || "";
                }
            } catch (e) {
                console.error("âŒ Error parsing members for email:", e);
            }
        }

        console.log(`ðŸ“§ Target Email: ${captainEmail}`);

        if (!process.env.RESEND_API_KEY) {
            console.error("âŒ RESEND_API_KEY is missing!");
            return { success: false, message: "Resend API key missing" };
        }

        // 3. Send Confirmation Email with Ticket Attachment
        if (captainEmail && process.env.RESEND_API_KEY) {
            console.log("ðŸŽ¨ Starting Ticket Generation...");
            const resend = new Resend(process.env.RESEND_API_KEY);

            const qrBuffer = await QRCode.toBuffer(registration.team_id, {
                width: 350,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF',
                },
            });

            const templatePath = path.join(process.cwd(), 'public', 'ticket-template.png');
            console.log(`ðŸ–¼ï¸ Loading template from: ${templatePath}`);

            if (!fs.existsSync(templatePath)) {
                console.error("âŒ Ticket template NOT FOUND at path:", templatePath);
                return { success: false, message: "Ticket template missing", error: "File not found" };
            }

            const templateBuffer = fs.readFileSync(templatePath);

            const svgText = Buffer.from(`
                <svg width="400" height="150">
                    <text x="50%" y="30%" font-family="Segoe UI, sans-serif" font-size="20" font-weight="900" fill="#000000" text-anchor="middle" dominant-baseline="middle" style="text-transform: uppercase; letter-spacing: 2px; opacity: 0.5;">TEAM ID</text>
                    <text x="50%" y="70%" font-family="Segoe UI, sans-serif" font-size="36" font-weight="900" fill="#62009B" text-anchor="middle" dominant-baseline="middle">${registration.team_id}</text>
                </svg>
            `);

            console.log("ðŸ§© Compositing ticket image...");
            const ticketBuffer = await sharp(templateBuffer)
                .composite([
                    {
                        input: qrBuffer,
                        top: 60,
                        left: 1575
                    },
                    {
                        input: svgText,
                        top: 420,
                        left: 1550
                    }
                ])
                .png()
                .toBuffer();

            console.log("ðŸ“¨ Sending email via Resend...");
            const { data, error: resendError } = await resend.emails.send({
                from: 'TRI-CITY AI HACKATHON <admin@tricity.online>',
                to: captainEmail,
                subject: `Registration Confirmed: See you at TRI-CITY AI HACKATHON ðŸš€`,
                attachments: [
                    {
                        filename: `tricity_Ticket_${registration.team_id}.png`,
                        content: ticketBuffer,
                    },
                ],
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; padding: 20px; border: 1px solid #eee; border-radius: 20px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #62009B; text-transform: uppercase; margin-bottom: 5px; font-size: 28px;">REGISTRATION CONFIRMED</h1>
                            <p style="color: #666; font-size: 18px; margin-top: 0;">You're officially a participant of TRI-CITY AI HACKATHON</p>
                        </div>
                        
                        <p>Dear <strong>${registration.captain}</strong>,</p>
                        <p>Congratulations! Your team <strong>${registration.team_name}</strong> has successfully completed the registration process for TRI-CITY AI HACKATHON. We are excited to have you on board!</p>

                        <div style="background: #f8f9fa; border: 2px solid #62009B; border-radius: 15px; padding: 25px; margin: 25px 0;">
                            <h3 style="margin-top: 0; font-size: 16px; color: #62009B; border-bottom: 1px solid #ddd; padding-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">Official Event Details</h3>
                            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                                <tr>
                                    <td style="padding: 8px 0; color: #666; width: 140px;"><strong>Team ID:</strong></td>
                                    <td style="font-weight: bold; color: #1a1a1a;">${registration.team_id}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #666; width: 140px;"><strong>Community:</strong></td>
                                    <td><a href="https://chat.whatsapp.com/J5Cqelh3gVPLalKt9FEqPp?mode=gi_t" style="color: #25d366; font-weight: bold; text-decoration: none;">Join WhatsApp Group</a></td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #666;"><strong>Track:</strong></td>
                                    <td>${registration.track}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #666;"><strong>Event Dates:</strong></td>
                                    <td style="color: #62009B; font-weight: 900;">27 - 28 February 2026</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #666;"><strong>Venue:</strong></td>
                                    <td>Centle India (Centle India), near Ramoji Film City, Deshmuki Village, Yadadri Bhuvanagiri, TS - 508284</td>
                                </tr>
                            </table>
                        </div>

                        <div style="text-align: center; margin: 30px 0; padding: 20px; border: 2px dashed #eee; border-radius: 15px;">
                            <h3 style="color: #62009B; margin-bottom: 10px;">Your Digital Entry Ticket</h3>
                            <p style="color: #777; font-size: 14px; margin-top: 0;">We have attached your official digital ticket to this email. Please keep it handy (on your phone or printed) for entry verification at the venue gate.</p>
                        </div>

                        <p style="font-size: 14px; line-height: 1.6; color: #555; background: #fff8e1; padding: 15px; border-radius: 10px; border-left: 4px solid #ffc107;">
                            <strong>Note:</strong> Join the <a href="https://chat.whatsapp.com/J5Cqelh3gVPLalKt9FEqPp?mode=gi_t" style="color: #62009B; font-weight: bold; text-decoration: none;">Official WhatsApp Community</a> for live updates, networking, and support. Your hacker desk details are also updated in your team dashboard.
                        </p>

                        <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
                            <p style="margin: 0; color: #999; font-size: 12px;">See you at the hackathon!</p>
                            <p style="margin: 5px 0; color: #62009B; font-weight: black; font-size: 14px;">TEAM TRI-CITY AI HACKATHON</p>
                            <p style="margin: 0; color: #ccc; font-size: 10px;">Centle India Flagship Event</p>
                        </div>
                    </div>
                `
            });

            if (resendError) {
                console.error("âŒ Resend API Error:", resendError);
                return { success: false, message: "Email failed", error: resendError };
            }

            console.log(`âœ¨ Email sent successfully to ${captainEmail}! ID: ${data?.id}`);
            return { success: true, team: registration.team_name, error: null };
        }

        return { success: false, message: "Email not sent (Missing data or API key)", error: null };

    } catch (error: any) {
        console.error('âŒ Verification Service Error:', error);
        return { success: false, message: "Service error", error: error.message || error };
    }
}
