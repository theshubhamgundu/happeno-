import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession, hasRole } from '@/lib/session';
import { hashPassword } from '@/lib/COST_FACTOR';
import { sendEmail } from '@/lib/email';
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

type Participant = {
    fullName?: string;
    email?: string;
    phone?: string;
    college?: string;
};

// GET: Check status of pending vs issued passes
export async function GET(req: Request) {
    const session = getSession(req);
    if (!hasRole(session, ['admin'])) {
        return NextResponse.json({ success: false, error: 'Administrator access required.' }, { status: 403 });
    }

    try {
        const { count: totalCount, error: totalErr } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true });

        if (totalErr) throw totalErr;

        const { count: pendingCount, error: pendingErr } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true })
            .is('credentials_issued_at', null);

        if (pendingErr) throw pendingErr;

        const total = totalCount || 0;
        const pending = pendingCount || 0;
        const issued = total - pending;

        return NextResponse.json({
            success: true,
            total,
            pending,
            issued,
            percentageIssued: total > 0 ? Math.round((issued / total) * 100) : 100
        });
    } catch (error: unknown) {
        console.error('Dispatch status error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch dispatch status.' }, { status: 500 });
    }
}

// POST: Run a micro-batch of credential dispatches
export async function POST(req: Request) {
    const session = getSession(req);
    if (!hasRole(session, ['admin'])) {
        return NextResponse.json({ success: false, error: 'Administrator access required.' }, { status: 403 });
    }

    try {
        const body = await req.json().catch(() => ({})) as {
            batchSize?: number;
            teamIds?: string[];
        };

        const batchLimit = Math.max(1, Math.min(Number(body.batchSize) || 15, 50));
        let query = supabase
            .from('registrations')
            .select('*');

        if (Array.isArray(body.teamIds) && body.teamIds.length > 0) {
            query = query.in('team_id', body.teamIds);
        } else {
            query = query.is('credentials_issued_at', null).limit(batchLimit);
        }

        const { data: teams, error: queryError } = await query;
        if (queryError) throw queryError;

        if (!teams || teams.length === 0) {
            return NextResponse.json({
                success: true,
                processed: 0,
                successCount: 0,
                failureCount: 0,
                remaining: 0,
                message: 'All registered teams have already been issued passes and credentials!'
            });
        }

        const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://happeno.in').replace(/\/+$/, '');
        let successCount = 0;
        let failureCount = 0;
        const results: Array<{ teamId: string; teamName: string; captainEmail: string; status: 'SUCCESS' | 'FAILED'; error?: string }> = [];

        for (const team of teams) {
            const teamId = team.team_id || team.transaction_id;
            const teamName = team.team_name || 'Team';
            const captainEmail = (team.email || '').trim().toLowerCase();
            const captainName = team.captain || 'Team Lead';

            if (!captainEmail || !/^\S+@\S+\.\S+$/.test(captainEmail)) {
                failureCount++;
                results.push({ teamId, teamName, captainEmail, status: 'FAILED', error: 'Invalid captain email' });
                continue;
            }

            try {
                // Generate clean, readable temporary password
                const temporaryPassword = generateTemporaryPassword();
                const passwordHash = await hashPassword(temporaryPassword);


                const safeTeamId = escapeHtml(teamId);
                const safeTeamName = escapeHtml(teamName);
                const safeCaptainName = escapeHtml(captainName);
                const safePassword = escapeHtml(temporaryPassword);
                const safeTrack = escapeHtml(team.track || 'General');

                // 1. Dispatch to Captain (Credentials + Pass Attachment)
                await sendEmail({
                    to: captainEmail,
                    subject: `[Pass & Credentials] Happeno Hackathon — ${teamName}`,

                    html: `
                        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#1a1a1a;line-height:1.6;padding:24px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;">
                            <div style="text-align:center;padding-bottom:16px;border-bottom:1px solid #f1f5f9;">
                                <h1 style="color:#0f172a;font-size:22px;margin:0;">HAPPENO HACKATHON OS</h1>
                                <p style="color:#64748b;font-size:12px;letter-spacing:1px;text-transform:uppercase;margin:4px 0 0;">Official Team Pass & Login Credentials</p>
                            </div>
                            <p style="margin-top:20px;">Hello <strong>${safeCaptainName}</strong>,</p>
                            <p>Congratulations! Your team <strong>${safeTeamName}</strong> is registered on the <strong>Happeno Hackathon Platform</strong>.</p>
                            
                            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:20px 0;">
                                <p style="margin:0 0 8px;font-size:13px;color:#475569;"><strong>Team Login ID:</strong> <span style="font-family:monospace;font-size:15px;color:#0f172a;background:#e2e8f0;padding:2px 6px;border-radius:4px;">${safeTeamId}</span></p>
                                <p style="margin:0 0 8px;font-size:13px;color:#475569;"><strong>Access Password:</strong> <span style="font-family:monospace;font-size:15px;color:#1e293b;background:#fef08a;padding:2px 6px;border-radius:4px;font-weight:bold;">${safePassword}</span></p>
                                <p style="margin:0;font-size:13px;color:#475569;"><strong>Team Portal:</strong> <a href="${appUrl}/login" style="color:#2563eb;text-decoration:none;font-weight:bold;">${appUrl}/login</a></p>
                            </div>

                            <p style="font-size:13px;color:#334155;"><strong>Your Check-in Passes:</strong> Please log in to the team dashboard using the link above to download your individual check-in QR passes. You will need to show these passes at the registration desk upon your arrival.</p>
                            
                            <p style="font-size:12px;color:#64748b;margin-top:16px;"><em>Note: As Team Lead, you have access to project submissions, meal tokens, and room assignments. Keep these credentials confidential.</em></p>
                            
                            <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
                            <p style="font-size:11px;color:#94a3b8;text-align:center;margin:0;">Happeno Organizing Team • happeno.in</p>
                        </div>
                    `
                });



                // 3. Mark credentials issued in database
                await supabase
                    .from('registrations')
                    .update({
                        password_hash: passwordHash,
                        credentials_issued_at: new Date().toISOString()
                    })
                    .eq('transaction_id', team.transaction_id);

                successCount++;
                results.push({ teamId, teamName, captainEmail, status: 'SUCCESS' });

            } catch (teamError: unknown) {
                console.error(`Dispatch failed for team ${teamId}:`, teamError);
                failureCount++;
                results.push({
                    teamId,
                    teamName,
                    captainEmail,
                    status: 'FAILED',
                    error: teamError instanceof Error ? teamError.message : 'Email delivery failed'
                });
            }
        }

        // Check remaining
        const { count: remainingCount } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true })
            .is('credentials_issued_at', null);

        return NextResponse.json({
            success: true,
            processed: teams.length,
            successCount,
            failureCount,
            remaining: remainingCount || 0,
            results
        });

    } catch (error: unknown) {
        console.error('Dispatch batch error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Dispatch operation failed'
        }, { status: 500 });
    }
}
