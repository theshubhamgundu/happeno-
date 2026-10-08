import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession, hasRole } from '@/lib/session';
import { generateRosterToken } from '@/lib/roster-security';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const session = getSession(req);
    if (!hasRole(session, ['admin'])) {
        return NextResponse.json({ error: 'Admin authorization required.' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { target = 'leads', batchSize = 25, offset = 0, teamId = null } = body;

        let query = supabase
            .from('registrations')
            .select('team_id, team_name, captain, email, captain_mobile, college, track, members, status')
            .neq('status', 'MERGED')
            .neq('status', 'REJECTED');

        if (teamId) {
            query = query.eq('team_id', teamId);
        } else {
            query = query.range(offset, offset + batchSize - 1);
        }

        const { data: teams, error, count } = await query;
        if (error) throw error;

        if (!teams || teams.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No remaining teams in this batch.',
                processed: 0,
                hasMore: false
            });
        }

        let sentCount = 0;
        let failCount = 0;
        const errors: string[] = [];

        for (const team of teams) {
            // ══════════════ TARGET 1: TEAM LEADS (MAGIC LINK ACCESS) ══════════════
            if (target === 'leads') {
                const leadEmail = (team.email || '').trim().toLowerCase();
                if (!leadEmail || !leadEmail.includes('@')) {
                    failCount++;
                    errors.push(`Team ${team.team_id}: Missing or invalid lead email`);
                    continue;
                }

                const token = generateRosterToken(team.team_id, leadEmail);
                const magicUrl = `https://tricity.centle.in/edit-registration?teamId=${encodeURIComponent(team.team_id)}&token=${encodeURIComponent(token)}`;

                const membersListHtml = Array.isArray(team.members) && team.members.length > 0
                    ? team.members.map((m: any, idx: number) => `
                        <li style="margin-bottom: 6px; font-size: 13px;">
                            <strong>Member ${idx + 1}:</strong> ${m.fullName || m.name || 'Unnamed'} 
                            <span style="color: #64748b;">(${m.email || 'No email'})</span>
                        </li>
                    `).join('')
                    : `<li style="font-size: 13px; color: #64748b;">No additional members listed. You can add teammates inside the portal.</li>`;

                try {
                    await sendEmail({
                        to: leadEmail,
                        subject: `[ACTION REQUIRED] Review Your Team Roster: Tri-City AI Hackathon 2026 (${team.team_id})`,
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #1e293b;">
                                <div style="background: #0f172a; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
                                    <h1 style="color: #14b8a6; margin: 0; font-size: 20px; letter-spacing: 1px;">TRI-CITY AI HACKATHON 2026</h1>
                                    <p style="color: #94a3b8; font-size: 12px; margin: 6px 0 0 0;">Official Team Correction & Verification Notice</p>
                                </div>
                                <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; background: #ffffff;">
                                    <p>Hello <strong>${team.captain}</strong>,</p>
                                    <p>Your team registration for <strong>Tri-City AI Hackathon 2026</strong> has been confirmed!</p>
                                    
                                    <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 16px; margin: 18px 0;">
                                        <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Assigned Team ID:</strong> <span style="font-family: monospace; color: #0d9488; font-size: 16px; font-weight: bold;">${team.team_id}</span></p>
                                        <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Team Name:</strong> ${team.team_name}</p>
                                        <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Registered Track:</strong> ${team.track || 'General'}</p>
                                        <p style="margin: 12px 0 4px 0; font-size: 12px; font-weight: bold; text-transform: uppercase; color: #64748b;">Current Team Members:</p>
                                        <ul style="margin: 0; padding-left: 20px;">
                                            ${membersListHtml}
                                        </ul>
                                    </div>

                                    <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 10px; padding: 14px; margin: 18px 0;">
                                        <h4 style="margin: 0 0 4px 0; color: #92400e; font-size: 13px;">⚠️ 48-Hour Team Details Edit Window Active</h4>
                                        <p style="margin: 0; font-size: 12px; color: #78350f; line-height: 1.5;">
                                            The Team Edit & Merge Window closes on <strong>October 6, 2026 at 11:59 PM</strong>. Please use the button below to fix name spelling, replace absent members, or merge teams. After October 6, all team details will be permanently locked.
                                        </p>
                                    </div>

                                    <div style="text-align: center; margin: 28px 0;">
                                        <a href="${magicUrl}" style="background: #14b8a6; color: #000000; font-weight: bold; text-decoration: none; padding: 14px 32px; border-radius: 10px; display: inline-block; font-size: 15px;">
                                            View & Edit Team Details
                                        </a>
                                    </div>

                                    <p style="font-size: 11px; color: #64748b; line-height: 1.5;">
                                        <em>Note: All team member changes and merges are handled directly via this self-service link. If you need any assistance, submit a query via the Help Desk widget on the page and our coordinators will contact you to help.</em>
                                    </p>
                                </div>
                            </div>
                        `
                    });
                    sentCount++;
                } catch (e: any) {
                    failCount++;
                    errors.push(`Team ${team.team_id}: ${e.message}`);
                }
            }

            // ══════════════ TARGET 2: TEAM MEMBERS (READ-ONLY CONFIRMATION) ══════════════
            if (target === 'members') {
                if (!Array.isArray(team.members) || team.members.length === 0) continue;

                for (const member of team.members) {
                    const memberEmail = (member?.email || '').trim().toLowerCase();
                    if (!memberEmail || !memberEmail.includes('@')) continue;

                    try {
                        await sendEmail({
                            to: memberEmail,
                            subject: `You are registered for Tri-City AI Hackathon 2026 (Team: ${team.team_name})`,
                            html: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
                                    <div style="background: #0f172a; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
                                        <h2 style="color: #14b8a6; margin: 0; font-size: 18px;">TRI-CITY AI HACKATHON 2026</h2>
                                        <p style="color: #94a3b8; font-size: 11px; margin: 4px 0 0 0;">Participant Confirmation</p>
                                    </div>
                                    <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; background: #ffffff;">
                                        <p>Hello <strong>${member.fullName || member.name || 'Participant'}</strong>,</p>
                                        <p>You are officially registered for Tri-City AI Hackathon 2026 under <strong>Team "${team.team_name}"</strong>!</p>
                                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin: 16px 0;">
                                            <p style="margin: 0; font-size: 13px;"><strong>Team ID:</strong> ${team.team_id}</p>
                                            <p style="margin: 4px 0 0 0; font-size: 13px;"><strong>Team Lead:</strong> ${team.captain} (${team.captain_mobile || 'Contact Lead'})</p>
                                            <p style="margin: 4px 0 0 0; font-size: 13px;"><strong>Event Dates:</strong> October 10–11, 2026</p>
                                        </div>
                                        <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
                                            Please verify that your name spelling is correct for your official certificate and digital check-in pass. If any changes, team merges, or substitutions are needed, <strong>please notify your Team Lead ${team.captain}</strong> before October 6, 2026 at 11:59 PM.
                                        </p>
                                    </div>
                                </div>
                            `
                        });
                        sentCount++;
                    } catch {
                        failCount++;
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            target,
            processed: teams.length,
            sentCount,
            failCount,
            hasMore: teams.length === batchSize,
            nextOffset: offset + teams.length,
            errors: errors.slice(0, 10)
        });

    } catch (err: unknown) {
        console.error('Dispatch Verification Emails Error:', err);
        const message = err instanceof Error ? err.message : 'Batch email dispatch failure.';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
