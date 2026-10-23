import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { supabase } from '@/lib/supabase';
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

export async function POST(req: Request) {
    if (!hasRole(getSession(req), ['admin'])) {
        return NextResponse.json({ success: false, message: 'Administrator access required.' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const transactionId = typeof body.transactionId === 'string' ? body.transactionId.trim() : '';
        if (!transactionId) {
            return NextResponse.json({ success: false, message: 'Transaction ID is required.' }, { status: 400 });
        }

        const { data: existing, error: lookupError } = await supabase
            .from('registrations')
            .select('transaction_id, team_id, team_name, track, captain, email, members, status, password_hash, credentials_issued_at, completed_at')
            .eq('transaction_id', transactionId)
            .maybeSingle();
        if (lookupError) throw lookupError;
        if (!existing) return NextResponse.json({ success: false, message: 'Registration not found.' }, { status: 404 });
        if (existing.status === 'COMPLETED') {
            return NextResponse.json({ success: false, message: 'This registration is already approved.' }, { status: 409 });
        }

        const members = Array.isArray(existing.members) ? existing.members : [];
        const captainEmail = existing.email || members[0]?.email || members[0]?.Email;
        if (typeof captainEmail !== 'string' || !captainEmail.trim()) {
            return NextResponse.json({ success: false, message: 'A captain email is required before approval.' }, { status: 422 });
        }

        const password = randomBytes(18).toString('base64url');
        const passwordHash = await hashPassword(password);
        const { data: approved, error: updateError } = await supabase
            .from('registrations')
            .update({ status: 'COMPLETED', password_hash: passwordHash, credentials_issued_at: new Date().toISOString(), completed_at: new Date().toISOString() })
            .eq('transaction_id', transactionId)
            .neq('status', 'COMPLETED')
            .select('team_id, team_name, track, captain')
            .maybeSingle();
        if (updateError) throw updateError;
        if (!approved) return NextResponse.json({ success: false, message: 'Registration was already approved.' }, { status: 409 });

        try {
            const teamName = escapeHtml(approved.team_name || 'Your team');
            const teamId = escapeHtml(approved.team_id || '');
            const captain = escapeHtml(approved.captain || 'Participant');
            const track = escapeHtml(approved.track || '');
            const signInUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://happeno.in'}/login`;
            const qrCode = await QRCode.toBuffer(approved.team_id || '', { width: 350, margin: 1 });
            await sendEmail({
                to: captainEmail.trim(),
                subject: `Registration approved: ${approved.team_name}`,
                attachments: [{ filename: `happeno-checkin-${(approved.team_id || '').replace(/[^a-zA-Z0-9_-]/g, '_')}.png`, content: qrCode }],
                html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#1a1a1a;line-height:1.6"><h1>Registration approved</h1><p>Hello ${captain},</p><p>Your team <strong>${teamName}</strong> has been approved for the Happeno Hackathon.</p><p><strong>Team ID:</strong> ${teamId}<br/><strong>Track:</strong> ${track}</p><p><strong>Login password:</strong> ${escapeHtml(password)}</p><p><a href="${escapeHtml(signInUrl)}">Sign in to your team dashboard</a>. Store this password securely; it cannot be retrieved later.</p><p>Your check-in QR code is attached.</p></div>`
            });
        } catch (emailError) {
            const { error: rollbackError } = await supabase
                .from('registrations')
                .update({ status: existing.status, password_hash: existing.password_hash, credentials_issued_at: existing.credentials_issued_at, completed_at: existing.completed_at })
                .eq('transaction_id', transactionId);
            if (rollbackError) console.error('Approval rollback failed:', rollbackError);
            console.error('Approval email failed:', emailError);
            return NextResponse.json({ success: false, message: 'Approval email failed; registration was not approved.' }, { status: 502 });
        }

        return NextResponse.json({ success: true, team: approved.team_name, message: 'Registration approved and credentials emailed.' });
    } catch (error) {
        console.error('Registration approval failed:', error);
        return NextResponse.json({ success: false, message: 'Could not approve registration in Supabase.' }, { status: 503 });
    }
}
