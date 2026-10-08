import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession, hasRole } from '@/lib/session';
import { hashPassword } from '@/lib/COST_FACTOR';
import { sendEmail } from '@/lib/email';
import { redis } from '@/lib/redis';
import QRCode from 'qrcode';

export const dynamic = 'force-dynamic';

function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character] || character);
}

function generateTemporaryPassword(): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const characters = Array.from(randomBytes(12), byte => alphabet[byte & 31]).join('');
    return `TRI-${characters.slice(0, 4)}-${characters.slice(4, 8)}`;
}

export async function POST(req: Request) {
    const session = getSession(req);
    if (!hasRole(session, ['admin'])) {
        return NextResponse.json({ success: false, error: 'Administrator access required.' }, { status: 403 });
    }

    try {
        const body = await req.json() as {
            teamId?: string;
            teamName?: string;
            captain?: string;
            email?: string;
            captainMobile?: string;
            college?: string;
            trackPreferences?: string[];
            room?: string;
            resendPass?: boolean;
        };

        const teamId = typeof body.teamId === 'string' ? body.teamId.trim() : '';
        if (!teamId) {
            return NextResponse.json({ success: false, error: 'Team ID is required.' }, { status: 400 });
        }

        // Find existing record
        const { data: team, error: lookupError } = await supabase
            .from('registrations')
            .select('*')
            .or(`team_id.eq.${teamId},transaction_id.eq.${teamId}`)
            .maybeSingle();

        if (lookupError) throw lookupError;
        if (!team) {
            return NextResponse.json({ success: false, error: 'Team not found.' }, { status: 404 });
        }

        const cleanEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : team.email;
        if (cleanEmail && !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
            return NextResponse.json({ success: false, error: 'Invalid email address provided.' }, { status: 422 });
        }

        const cleanCaptain = typeof body.captain === 'string' ? body.captain.trim() : team.captain;
        const cleanTeamName = typeof body.teamName === 'string' ? body.teamName.trim() : team.team_name;
        const cleanMobile = typeof body.captainMobile === 'string' ? body.captainMobile.trim() : team.captain_mobile;
        const cleanCollege = typeof body.college === 'string' ? body.college.trim() : team.college;

        const cleanTrackPrefs = Array.isArray(body.trackPreferences)
            ? body.trackPreferences.map(t => typeof t === 'string' ? t.trim() : '').filter(Boolean)
            : (Array.isArray(team.track_preferences) ? team.track_preferences : (team.track ? [team.track] : []));
        const cleanTrack = cleanTrackPrefs.length > 0 ? cleanTrackPrefs[0] : '';
        const cleanRoom = typeof body.room === 'string' ? body.room.trim() : team.room;

        // Synchronize members list (update the captain details in members[0])
        const members = Array.isArray(team.members) ? [...team.members] : [];
        if (members.length > 0 && typeof members[0] === 'object' && members[0] !== null) {
            members[0] = {
                ...members[0],
                fullName: cleanCaptain || (members[0] as Record<string, unknown>).fullName,
                email: cleanEmail || (members[0] as Record<string, unknown>).email,
                phone: cleanMobile || (members[0] as Record<string, unknown>).phone,
                college: cleanCollege || (members[0] as Record<string, unknown>).college,
            };
        }

        const updateData: Record<string, unknown> = {
            team_name: cleanTeamName,
            captain: cleanCaptain,
            email: cleanEmail,
            captain_mobile: cleanMobile,
            college: cleanCollege,
            track: cleanTrack,
            track_preferences: cleanTrackPrefs,
            room: cleanRoom,
            members
        };

        let temporaryPassword = '';
        let emailAccepted = false;
        let emailErrorMsg = '';

        if (body.resendPass) {
            temporaryPassword = generateTemporaryPassword();
            const passwordHash = await hashPassword(temporaryPassword);
            const credentialsIssuedAt = new Date().toISOString();
            updateData.password_hash = passwordHash;
            updateData.credentials_issued_at = credentialsIssuedAt;


            const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://tricity.centle.in').replace(/\/+$/, '');
            const safeTeamId = escapeHtml(team.team_id || teamId);
            const safeTeamName = escapeHtml(cleanTeamName || 'Your team');
            const safePassword = escapeHtml(temporaryPassword);
            const safeLeadName = escapeHtml(cleanCaptain || 'Team Lead');

            try {
                const delivery = await sendEmail({
                    to: cleanEmail,
                    subject: `[Pass & Credentials] Tri-City AI Hackathon — ${cleanTeamName}`,

                    html: `
                        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#1a1a1a;line-height:1.6;padding:24px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;">
                            <div style="text-align:center;padding-bottom:16px;border-bottom:1px solid #f1f5f9;">
                                <h1 style="color:#0f172a;font-size:22px;margin:0;">TRI-CITY AI HACKATHON 2026</h1>
                                <p style="color:#64748b;font-size:12px;letter-spacing:1px;text-transform:uppercase;margin:4px 0 0;">Updated Team Pass & Access Credentials</p>
                            </div>
                            <p style="margin-top:20px;">Hello <strong>${safeLeadName}</strong>,</p>
                            <p>Your team details and digital check-in pass for <strong>${safeTeamName}</strong> have been updated by event administration.</p>
                            
                            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:20px 0;">
                                <p style="margin:0 0 8px;font-size:13px;color:#475569;"><strong>Team Login ID:</strong> <span style="font-family:monospace;font-size:15px;color:#0f172a;background:#e2e8f0;padding:2px 6px;border-radius:4px;">${safeTeamId}</span></p>
                                <p style="margin:0 0 8px;font-size:13px;color:#475569;"><strong>Access Password:</strong> <span style="font-family:monospace;font-size:15px;color:#1e293b;background:#fef08a;padding:2px 6px;border-radius:4px;font-weight:bold;">${safePassword}</span></p>
                                <p style="margin:0;font-size:13px;color:#475569;"><strong>Portal Link:</strong> <a href="${appUrl}/login" style="color:#2563eb;text-decoration:none;font-weight:bold;">${appUrl}/login</a></p>
                            </div>

                            <p style="font-size:13px;color:#334155;"><strong>Your Check-in Passes:</strong> Please log in to the team dashboard using the link above to download your individual check-in QR passes. You will need to show these passes at the registration desk upon your arrival.</p>
                            
                            <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
                            <p style="font-size:11px;color:#94a3b8;text-align:center;margin:0;">Tri-City AI Hackathon Organizing Committee • Event Support Desk</p>
                        </div>
                    `
                });
                emailAccepted = Array.isArray(delivery.accepted) && delivery.accepted.length > 0;
            } catch (err: unknown) {
                console.error(`Resend email failed for ${teamId}:`, err);
                emailErrorMsg = err instanceof Error ? err.message : 'SMTP dispatch failed';
            }
        }

        const { error: updateError } = await supabase
            .from('registrations')
            .update(updateData)
            .eq('transaction_id', team.transaction_id);

        if (updateError) throw updateError;

        // Invalidate redis cache
        if (redis) {
            try {
                await redis.del('all_teams_cache_admin');
                await redis.del('all_teams_cache_livescore');
            } catch (e) {
                console.error('Redis cache invalidate error:', e);
            }
        }

        return NextResponse.json({
            success: true,
            teamId: team.team_id || teamId,
            temporaryPassword: temporaryPassword || undefined,
            emailAccepted,
            emailError: emailErrorMsg || undefined,
            message: body.resendPass
                ? (emailAccepted ? 'Team updated and fresh pass emailed to lead.' : `Team updated. SMTP failed (${emailErrorMsg || 'check credentials'}). Provide the temporary password directly to the participant.`)
                : 'Team contact details updated successfully.'
        });

    } catch (error: unknown) {
        console.error('Admin edit team error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Could not update team.'
        }, { status: 500 });
    }
}
