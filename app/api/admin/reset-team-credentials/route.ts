import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { teamSupabase as supabase } from '@/lib/supabase';
import { getSession, hasRole } from '@/lib/session';
import { hashPassword } from '@/lib/COST_FACTOR';
import { sendEmail } from '@/lib/email';

function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character] || character);
}

function memberEmail(member: unknown): string {
    if (!member || typeof member !== 'object') return '';
    const record = member as Record<string, unknown>;
    const value = record.email ?? record.Email;
    return typeof value === 'string' ? value.trim() : '';
}

function memberName(member: unknown): string {
    if (!member || typeof member !== 'object') return '';
    const record = member as Record<string, unknown>;
    const value = record.fullName ?? record.name;
    return typeof value === 'string' ? value.trim() : '';
}

function generateTemporaryPassword(): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const characters = Array.from(randomBytes(12), byte => alphabet[byte & 31]).join('');
    return `${characters.slice(0, 4)}-${characters.slice(4, 8)}-${characters.slice(8, 12)}`;
}

export async function POST(req: Request) {
    if (!hasRole(getSession(req), ['admin'])) {
        return NextResponse.json({ success: false, error: 'Administrator access required.' }, { status: 403 });
    }

    try {
        const body = await req.json() as { teamId?: unknown };
        const teamId = typeof body.teamId === 'string' ? body.teamId.trim().toUpperCase() : '';
        if (!teamId) {
            return NextResponse.json({ success: false, error: 'Team ID is required.' }, { status: 400 });
        }

        const { data: team, error: lookupError } = await supabase
            .from('registrations')
            .select('team_id, team_name, captain, email, members, status')
            .eq('team_id', teamId)
            .maybeSingle();
        if (lookupError) throw lookupError;
        if (!team) {
            return NextResponse.json({ success: false, error: 'Team not found.' }, { status: 404 });
        }
        if (['PENDING', 'REJECTED', 'MERGED'].includes(String(team.status).toUpperCase())) {
            return NextResponse.json({ success: false, error: 'Credentials cannot be reset for this team status.' }, { status: 409 });
        }

        const members = Array.isArray(team.members) ? team.members : [];
        const captainName = typeof team.captain === 'string' ? team.captain.trim().toLowerCase() : '';
        const captain = members.find(member => captainName && memberName(member).toLowerCase() === captainName) || members[0];
        const leadEmail = memberEmail(captain) || (typeof team.email === 'string' ? team.email.trim() : '');
        if (!/^\S+@\S+\.\S+$/.test(leadEmail)) {
            return NextResponse.json({ success: false, error: 'A valid team lead email is required before resetting credentials.' }, { status: 422 });
        }

        const temporaryPassword = generateTemporaryPassword();
        const passwordHash = await hashPassword(temporaryPassword);
        const credentialsIssuedAt = new Date().toISOString();
        const { data: updated, error: updateError } = await supabase
            .from('registrations')
            .update({ password_hash: passwordHash, credentials_issued_at: credentialsIssuedAt })
            .eq('team_id', team.team_id)
            .select('team_id')
            .maybeSingle();
        if (updateError) throw updateError;
        if (!updated) {
            return NextResponse.json({ success: false, error: 'Could not update team credentials.' }, { status: 500 });
        }

        const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://happeno.in').replace(/\/+$/, '');
        const safeTeamId = escapeHtml(team.team_id);
        const safeTeamName = escapeHtml(team.team_name || 'Your team');
        const safePassword = escapeHtml(temporaryPassword);
        let emailAccepted = false;
        try {
            const delivery = await sendEmail({
                to: leadEmail,
                subject: `New login credentials: ${team.team_name || team.team_id}`,
                text: `New team login credentials\n\nTeam: ${team.team_name || 'Your team'}\nTeam ID: ${team.team_id}\nNew password: ${temporaryPassword}\nSign in: ${appUrl}/login\n\nYour previous password no longer works. Contact the event team if you need further assistance.`,
                html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#1a1a1a;line-height:1.6"><h1>New team login credentials</h1><p>Login access for <strong>${safeTeamName}</strong> has been reset by the event administrators.</p><p><strong>Team ID:</strong> ${safeTeamId}<br/><strong>New password:</strong> ${safePassword}</p><p><a href="${escapeHtml(`${appUrl}/login`)}">Sign in to the team portal</a>.</p><p>Your previous password no longer works. Contact the event team if you need further assistance.</p></div>`
            });
            emailAccepted = Array.isArray(delivery.accepted) && delivery.accepted.length > 0;
        } catch (emailError: unknown) {
            console.error(`Credential reset email failed for team ${team.team_id}:`, emailError);
        }

        return NextResponse.json({
            success: true,
            teamId: team.team_id,
            leadEmail,
            emailAccepted,
            temporaryPassword,
            message: emailAccepted
                ? 'The SMTP server accepted the credentials email. Inbox delivery is not confirmed.'
                : 'Credentials were reset, but the SMTP server did not accept the email. Share the new password with the lead through a verified channel.'
        }, { headers: { 'Cache-Control': 'no-store, private', 'Pragma': 'no-cache' } });
    } catch (error: unknown) {
        console.error('Team credential reset failed:', error);
        return NextResponse.json({ success: false, error: 'Could not reset team credentials.' }, { status: 500 });
    }
}
