import { NextResponse } from 'next/server';
import { teamSupabase as supabase } from '@/lib/supabase';
import { randomBytes } from 'node:crypto';
import { Resend } from 'resend';
import QRCode from 'qrcode';

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
    try {
        const body = await req.json() as { registrations?: unknown };
        const incomingRegs = body.registrations;

        if (!incomingRegs || !Array.isArray(incomingRegs)) {
            return NextResponse.json({ error: 'Invalid payload format. Expected { "registrations": [...] }' }, { status: 400 });
        }
        if (incomingRegs.length === 0) {
            return NextResponse.json({ error: 'No registrations were found in the import.' }, { status: 400 });
        }

        const usedTeamIds = new Set<string>();
        const registrations: Registration[] = incomingRegs.map((value: unknown, index: number) => {
            const reg = value && typeof value === 'object' ? value as Record<string, unknown> : {};
            const participants: Participant[] = Array.isArray(reg.participants)
                ? reg.participants.filter((participant): participant is Record<string, unknown> => Boolean(participant) && typeof participant === 'object')
                    .map(participant => ({
                        fullName: textValue(participant.fullName),
                        email: textValue(participant.email),
                        phone: textValue(participant.phone),
                        college: textValue(participant.college),
                        year: textValue(participant.year),
                        department: textValue(participant.department)
                    }))
                : [];
            const teamId = textValue(reg.teamId) || `TRICITY_IMPORT_${randomBytes(8).toString('hex').toUpperCase()}`;
            if (usedTeamIds.has(teamId)) {
                throw new Error(`Duplicate registration ID in import: ${teamId}`);
            }
            usedTeamIds.add(teamId);

            const count = participants.length;

            let entry_type = 'INDIVIDUAL';
            if (count === 2) entry_type = 'DUO';
            if (count > 2) entry_type = 'SQUAD';

            const captain = participants[0] || {};
            const teamName = textValue(reg.teamName) || captain.fullName || `Participant ${index + 1}`;
            return {
                teamId,
                participants,
                captain,
                teamName,
                track: textValue(reg.track) || 'TBD',
                problemStatement: textValue(reg.problemStatement),
                entryType: entry_type
            };
        });

        const { data: existingRows, error: lookupError } = await supabase
            .from('registrations')
            .select('team_id, password, status')
            .in('team_id', registrations.map(registration => registration.teamId));

        if (lookupError) {
            return NextResponse.json({ error: 'Failed to check existing registrations', details: lookupError.message }, { status: 500 });
        }

        const existingPasswords = new Map<string, string | null>(
            (existingRows || []).map((row: { team_id: string; password: string | null }) => [row.team_id, row.password] as [string, string | null])
        );
        const existingStatuses = new Map<string, string | null>(
            (existingRows || []).map((row: { team_id: string; status: string | null }) => [row.team_id, row.status] as [string, string | null])
        );
        const teamCredentials = new Map<string, string>();
        const toInsert = registrations.map(registration => {
            const password = existingPasswords.get(registration.teamId) || randomBytes(12).toString('base64url');
            teamCredentials.set(registration.teamId, password);
            return {
                team_name: registration.teamName,
                team_id: registration.teamId,
                password,
                track: registration.track,
                problem_statement: registration.problemStatement,
                college: registration.captain.college || '',
                captain: registration.captain.fullName || '',
                captain_mobile: registration.captain.phone || '',
                email: registration.captain.email || '',
                members: registration.participants,
                entry_type: registration.entryType,
                status: existingStatuses.get(registration.teamId) || 'REGISTERED',
                raw_data: registration
            };
        });

        const { data, error } = await supabase
            .from('registrations')
            .upsert(toInsert, { onConflict: 'team_id' })
            .select('transaction_id, team_id, entry_type, team_name, members');

        if (error) {
            console.error('❌ Supabase Insert Error:', error);
            return NextResponse.json({ error: 'Failed to insert registrations', details: error.message }, { status: 500 });
        }

        let emailsSent = 0;
        let emailFailures = 0;
        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
            emailFailures = registrations.reduce((total, registration) => total + registration.participants.filter(member => member.email).length, 0);
            emailFailures += registrations.filter(registration => !registration.captain.email).length;
        } else {
            const resend = new Resend(resendApiKey);
            for (const registration of registrations) {
                const teamId = registration.teamId;
                const qrBuffer = await QRCode.toBuffer(teamId, { width: 350, margin: 1 });
                const password = teamCredentials.get(teamId)!;
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
                    const credentialBlock = isCaptain
                        ? `<p><strong>Team login ID:</strong> ${safeTeamId}<br/><strong>Password:</strong> ${escapeHtml(password)}</p><p>Sign in at <a href="https://tricity.online/login">tricity.online/login</a>.</p>`
                        : '';
                    try {
                        const { error: emailError } = await resend.emails.send({
                            from: 'TRI-CITY AI HACKATHON <admin@tricity.online>',
                            to: member.email.trim(),
                            subject: `Registration confirmed: ${registration.teamName}`,
                            attachments: [{ filename: `tricity-checkin-${teamId.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`, content: qrBuffer }],
                            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#1a1a1a;line-height:1.6"><h1>Registration confirmed</h1><p>Hello ${memberName},</p><p>Your team <strong>${teamName}</strong> is registered for TRI-CITY AI HACKATHON.</p><p><strong>Registration ID:</strong> ${safeTeamId}</p>${credentialBlock}<p>Your check-in QR code is attached. Please present it at the venue.</p></div>`
                        });
                        if (emailError) emailFailures++;
                        else emailsSent++;
                    } catch (emailError: unknown) {
                        console.error(`Failed to send import confirmation to ${member.email}:`, emailError);
                        emailFailures++;
                    }
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
