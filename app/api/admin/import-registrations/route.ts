import { NextResponse } from 'next/server';
import { teamSupabase as supabase } from '@/lib/supabase';
import { randomBytes } from 'node:crypto';
import QRCode from 'qrcode';
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

type Participant = {
    fullName: string;
    email: string;
    phone: string;
    college: string;
    year: string;
    department: string;
};

type Registration = {
    teamId: string;
    participants: Participant[];
    captain: Participant;
    teamName: string;
    track: string;
    problemStatement: string;
    entryType: string;
};

function textValue(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
}

function normalizeEmail(value: unknown): string {
    return textValue(value).toLowerCase();
}

function normalizeParticipant(participant: unknown): Participant {
    if (!participant || typeof participant !== 'object') {
        return { fullName: '', email: '', phone: '', college: '', year: '', department: '' };
    }

    const record = participant as Record<string, unknown>;
    return {
        fullName: textValue(record.fullName ?? record.name ?? record.full_name ?? record['Full Name'] ?? record['Name']),
        email: normalizeEmail(record.email ?? record.Email ?? record['Email Address'] ?? record['email_address']),
        phone: textValue(record.phone ?? record.mobile ?? record.Phone ?? record['Phone Number'] ?? record['Mobile Number']),
        college: textValue(record.college ?? record.collegeName ?? record['College'] ?? record['College Name']),
        year: textValue(record.year ?? record.Year ?? record['Year of Study']),
        department: textValue(record.department ?? record.Department ?? record['Department Name'])
    };
}

function normalizeRegistration(value: unknown, index: number): Registration {
    const reg = value && typeof value === 'object' ? value as Record<string, unknown> : {};

    const rawParticipants = Array.isArray(reg.participants)
        ? reg.participants
        : Array.isArray(reg.members)
            ? reg.members
            : [];

    const participants = rawParticipants
        .map(normalizeParticipant)
        .filter(participant => participant.fullName || participant.email || participant.phone || participant.college)
        .slice(0, 4);
    const suppliedCaptain = normalizeParticipant(reg.captain);
    const captain = suppliedCaptain.fullName || suppliedCaptain.email
        ? suppliedCaptain
        : participants[0] || {
            fullName: textValue(reg.captainName ?? reg['Leader Name'] ?? reg['Captain Name']),
            email: normalizeEmail(reg.email ?? reg['Leader Email'] ?? reg['Captain Email']),
            phone: textValue(reg.captainMobile ?? reg.captain_mobile ?? reg.phone ?? reg['Leader Phone'] ?? reg['Captain Phone']),
            college: textValue(reg.college ?? reg['College'] ?? reg['Leader College']),
            year: '',
            department: ''
        };
    const normalizedParticipants = participants.length > 0
        ? [captain, ...participants.filter(participant => participant.email.toLowerCase() !== captain.email.toLowerCase())]
        : captain.fullName || captain.email
            ? [captain]
            : [];

    const teamId = textValue(reg.teamId ?? reg.team_id ?? reg.id ?? reg['Team ID'] ?? reg['Registration ID'] ?? reg['teamId'])
        || `TRICITY_IMPORT_${randomBytes(6).toString('hex').toUpperCase()}`;

    const teamName = textValue(reg.teamName ?? reg.team_name ?? reg.name ?? reg['Team Name'] ?? reg['team_name'])
        || participants[0]?.fullName
        || `Participant ${index + 1}`;

    return {
        teamId,
        participants: normalizedParticipants,
        captain,
        teamName,
        track: textValue(reg.track ?? reg['Track'] ?? reg['Selected Tracks'] ?? reg['track_name']) || 'General',
        problemStatement: textValue(reg.problemStatement ?? reg.problem_statement ?? reg['Problem Statement'] ?? reg['problem_statement']),
        entryType: textValue(reg.entryType ?? reg.entry_type ?? reg['Entry Type']) || (normalizedParticipants.length > 2 ? 'SQUAD' : normalizedParticipants.length === 2 ? 'DUO' : 'INDIVIDUAL')
    };
}

/**
 * Expected Payload Format:
 * {
 *   "registrations": [
 *     {
 *       "participants": [
 *         { "fullName": "Alice", "email": "alice@ex.com", "phone": "123", "college": "ABC" },
 *         ... up to 4 participants
 *       ],
 *       "track": "General",
 *       "problemStatement": "Description of the idea"
 *     }
 *   ]
 * }
 */

export async function POST(req: Request) {
    if (!hasRole(getSession(req), ['admin'])) {
        return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });
    }

    try {
        const body = await req.json() as { registrations?: unknown; skipEmail?: boolean };
        const incomingRegs = body.registrations;
        const skipEmail = Boolean(body.skipEmail);

        if (!incomingRegs || !Array.isArray(incomingRegs)) {
            return NextResponse.json({ error: 'Invalid payload format. Expected { "registrations": [...] }' }, { status: 400 });
        }
        if (incomingRegs.length === 0) {
            return NextResponse.json({ error: 'No registrations were found in the import.' }, { status: 400 });
        }

        const usedTeamIds = new Set<string>();
        const registrations: Registration[] = incomingRegs.map((value: unknown, index: number) => {
            const registration = normalizeRegistration(value, index);
            if (usedTeamIds.has(registration.teamId)) {
                throw new Error(`Duplicate registration ID in import: ${registration.teamId}`);
            }
            usedTeamIds.add(registration.teamId);

            if (!registration.participants.length) {
                throw new Error(`Registration ${registration.teamId} is missing participant data.`);
            }

            const lead = registration.participants[0];
            if (!lead.fullName || !lead.email || !lead.phone || !lead.college) {
                throw new Error(`Registration ${registration.teamId} must include a valid lead with name, email, phone, and college.`);
            }
            if (!/^\S+@\S+\.\S+$/.test(lead.email)) {
                throw new Error(`Registration ${registration.teamId} has an invalid lead email address.`);
            }

            return registration;
        });

        const { data: existingRows, error: lookupError } = await supabase
            .from('registrations')
            .select('team_id, password_hash, credentials_issued_at, status')
            .in('team_id', registrations.map(registration => registration.teamId));

        if (lookupError) {
            return NextResponse.json({ error: 'Failed to check existing registrations', details: lookupError.message }, { status: 500 });
        }

        const existingRegistrations = new Map<string, { password_hash: string | null; credentials_issued_at: string | null; status: string | null }>(
            (existingRows || []).map((row: { team_id: string; password_hash: string | null; credentials_issued_at: string | null; status: string | null }) => [row.team_id, row] as [string, { password_hash: string | null; credentials_issued_at: string | null; status: string | null }])
        );
        const teamCredentials = new Map<string, string>();
        const toInsert = await Promise.all(registrations.map(async registration => {
            const existing = existingRegistrations.get(registration.teamId);
            const credentialsIssuedAt = existing?.credentials_issued_at || null;
            const password = credentialsIssuedAt ? null : randomBytes(18).toString('base64url');
            if (password) teamCredentials.set(registration.teamId, password);
            return {
                team_name: registration.teamName,
                team_id: registration.teamId,
                password_hash: password ? await hashPassword(password) : existing?.password_hash || null,
                credentials_issued_at: credentialsIssuedAt,
                track: registration.track,
                problem_statement: registration.problemStatement,
                college: registration.captain.college || '',
                captain: registration.captain.fullName || '',
                captain_mobile: registration.captain.phone || '',
                email: registration.captain.email || '',
                members: registration.participants,
                entry_type: registration.entryType,
                status: existing?.status || 'REGISTERED',
                raw_data: registration
            };
        }));

        const { data, error } = await supabase
            .from('registrations')
            .upsert(toInsert, { onConflict: 'team_id' })
            .select('transaction_id, team_id, entry_type, team_name, members');

        if (error) {
            console.error('❌ Supabase Insert Error:', error);
            return NextResponse.json({ error: 'Failed to insert registrations', details: error.message }, { status: 500 });
        }

        if (skipEmail) {
            return NextResponse.json({
                success: true,
                imported: data?.length || 0,
                emailsSent: 0,
                emailFailures: 0,
                message: `Successfully imported ${data?.length || 0} registrations into database.`
            });
        }

        let emailsSent = 0;
        let emailFailures = 0;
        const signInUrl = escapeHtml(`${(process.env.NEXT_PUBLIC_APP_URL || 'https://tricity.centle.in').replace(/\/+$/, '')}/login`);
        for (const registration of registrations) {
            const teamId = registration.teamId;
            const qrBuffer = await QRCode.toBuffer(teamId, { width: 350, margin: 1 });
            const password = teamCredentials.get(teamId);
            const recipients = registration.participants
                .map((member, participantIndex) => ({ member, participantIndex }))
                .filter(({ member }) => member.email)
                .filter(({ member }, index, members) =>
                    members.findIndex(candidate => candidate.member.email.toLowerCase() === member.email.toLowerCase()) === index
                );
            if (!registration.captain.email) emailFailures++;

            for (const { member, participantIndex } of recipients) {
                const isCaptain = participantIndex === 0;
                const teamName = escapeHtml(registration.teamName);
                const memberName = escapeHtml(member.fullName || 'Participant');
                const safeTeamId = escapeHtml(teamId);
                const credentialBlock = isCaptain && password
                    ? `<p><strong>Team login ID:</strong> ${safeTeamId}<br/><strong>Password:</strong> ${escapeHtml(password)}</p><p>Sign in at <a href="${signInUrl}">${signInUrl}</a>.</p>`
                    : '';
                try {
                    await sendEmail({
                        to: member.email.trim(),
                        subject: `Registration confirmed: ${registration.teamName}`,
                        attachments: [{ filename: `tricity-checkin-${teamId.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`, content: qrBuffer }],
                        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#1a1a1a;line-height:1.6"><h1>Registration confirmed</h1><p>Hello ${memberName},</p><p>Your team <strong>${teamName}</strong> is registered for TRI-CITY AI HACKATHON.</p><p><strong>Registration ID:</strong> ${safeTeamId}</p>${credentialBlock}<p>Your check-in QR code is attached. Please present it at the venue.</p></div>`
                    });
                    emailsSent++;
                    if (isCaptain && password) {
                        const { error: credentialUpdateError } = await supabase
                            .from('registrations')
                            .update({ credentials_issued_at: new Date().toISOString() })
                            .eq('team_id', teamId);
                        if (credentialUpdateError) {
                            console.error(`Failed to mark credentials issued for ${teamId}:`, credentialUpdateError);
                            emailFailures++;
                        }
                    }
                } catch (emailError: unknown) {
                    console.error(`Failed to send import email for team ${teamId}:`, emailError);
                    emailFailures++;
                }
            }
        }

        return NextResponse.json({
            success: true,
            imported: data?.length || 0,
            emailsSent,
            emailFailures,
            message: `Successfully imported ${data?.length || 0} registrations.`
        });

    } catch (error: unknown) {
        console.error('❌ Import Registrations API Error:', error);
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
