import { NextResponse } from 'next/server';
import { getSession, hasRole } from '@/lib/session';
import { getInboundEmails } from '@/lib/imap';
import { supabase } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

const HELP_QUEUE_KEY = 'help_tickets_queue';

export async function GET(req: Request) {
    const session = getSession(req);
    if (!hasRole(session, ['admin', 'volunteer'])) {
        return NextResponse.json({ error: 'Admin or Volunteer authorization required.' }, { status: 401 });
    }

    try {
        const { status, emails } = await getInboundEmails(25);

        // Fetch team list to associate sender email with registered teams
        const { data: teams } = await supabase
            .from('projects')
            .select('id, team, lead_email, email, captain, phone, members');

        const teamMap = new Map<string, { id: string; name: string }>();
        if (teams) {
            for (const t of teams) {
                const lead = (t.lead_email || t.email || '').toLowerCase().trim();
                if (lead) teamMap.set(lead, { id: t.id, name: t.team });

                // Check members array
                if (Array.isArray(t.members)) {
                    for (const m of t.members) {
                        const mEmail = (m?.email || '').toLowerCase().trim();
                        if (mEmail) teamMap.set(mEmail, { id: t.id, name: t.team });
                    }
                }
            }
        }

        // Attach matched team info
        const enrichedEmails = emails.map(email => {
            const senderClean = (email.fromEmail || '').toLowerCase().trim();
            const matched = teamMap.get(senderClean);
            return {
                ...email,
                matchedTeamId: matched?.id,
                matchedTeamName: matched?.name
            };
        });

        return NextResponse.json({
            success: true,
            status,
            emails: enrichedEmails
        });
    } catch (err: unknown) {
        console.error('Inbound Email Error:', err);
        const message = err instanceof Error ? err.message : 'Failed to fetch inbound emails from cPanel.';
        return NextResponse.json({
            success: false,
            error: message,
            configuredServer: process.env.SMTP_TLS_SERVERNAME || 'cloud-xent.crazzydns.com',
            user: process.env.SMTP_USER || 'business@centle.in'
        }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = getSession(req);
    if (!hasRole(session, ['admin'])) {
        return NextResponse.json({ error: 'Admin authorization required.' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { action } = body;

        if (action === 'create_ticket') {
            const { emailId, fromEmail, fromName, subject, snippet, teamId, teamName } = body;

            // Load existing tickets
            let existingTickets: any[] = [];
            if (redis) {
                const raw = await redis.get(HELP_QUEUE_KEY);
                if (raw) existingTickets = typeof raw === 'string' ? JSON.parse(raw) : raw;
            } else {
                const { data } = await supabase.from('hackathon_settings').select('value').eq('key', HELP_QUEUE_KEY).maybeSingle();
                if (data?.value && Array.isArray(data.value)) existingTickets = data.value;
            }

            const newTicket = {
                id: `TICK-MAIL-${Date.now().toString().slice(-6)}`,
                teamId: teamId || 'GUEST',
                teamName: teamName || fromName || fromEmail,
                category: 'Email Query',
                description: `[Email from: ${fromEmail}]\nSubject: ${subject}\n\n${snippet}`,
                status: 'open',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const updatedTickets = [newTicket, ...existingTickets];

            if (redis) {
                await redis.set(HELP_QUEUE_KEY, JSON.stringify(updatedTickets));
            }
            await supabase.from('hackathon_settings').upsert({
                key: HELP_QUEUE_KEY,
                value: updatedTickets,
                updated_at: new Date().toISOString()
            });

            return NextResponse.json({
                success: true,
                message: `Ticket ${newTicket.id} created from inbound email.`,
                ticket: newTicket
            });
        }

        if (action === 'reply_email') {
            const { to, subject, replyText, originalSubject } = body;
            if (!to || !replyText) {
                return NextResponse.json({ error: 'Recipient and reply message are required.' }, { status: 400 });
            }

            const replySubject = subject.startsWith('Re:') ? subject : `Re: ${originalSubject || subject}`;

            await sendEmail({
                to,
                subject: replySubject,
                text: replyText,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
                        <div style="background: #0f172a; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
                            <h2 style="color: #14b8a6; margin: 0; font-size: 18px; letter-spacing: 1px;">TRI-CITY AI HACKATHON 2026</h2>
                            <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 11px;">Official Support Response</p>
                        </div>
                        <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; background: #ffffff;">
                            <p style="white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: #334155;">${replyText}</p>
                            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                            <p style="font-size: 11px; color: #64748b; margin: 0;">
                                This response was sent by the Tri-City Hackathon Organizing Committee via <strong>business@centle.in</strong>.<br/>
                                If you have any urgent issues during the event, visit the Admin / Help Desk at the venue.
                            </p>
                        </div>
                    </div>
                `
            });

            return NextResponse.json({
                success: true,
                message: `Reply email sent to ${to} successfully.`
            });
        }

        return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
    } catch (err: unknown) {
        console.error('Inbound Email Action Error:', err);
        const message = err instanceof Error ? err.message : 'Failed to process email action.';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
