import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { setSessionCookie } from '@/lib/session';
import { getParticipantPortalMode } from '@/lib/event-windows';
import { verifyRosterToken, generateRosterToken, rateLimitRosterAction, getPendingMergeForTeam } from '@/lib/roster-security';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

    // Anti-brute-force rate limit
    const allowed = await rateLimitRosterAction(ip, 12, 600); // 12 attempts per 10 mins
    if (!allowed) {
        return NextResponse.json({
            success: false,
            error: 'Too many verification attempts from this network. Please wait 10 minutes.'
        }, { status: 429 });
    }

    try {
        const body = await req.json();
        const { action } = body;

        // ══════════════ ACTION: LOOKUP TEAM ID (Self-Help Tool) ══════════════
        if (action === 'lookup_team') {
            const { query } = body; // email or phone
            if (!query || typeof query !== 'string' || query.trim().length < 4) {
                return NextResponse.json({ success: false, error: 'Please enter a valid email or 10-digit phone number.' }, { status: 400 });
            }

            const cleanQuery = query.trim().toLowerCase();

            // Search in registrations
            const { data: matches, error } = await supabase
                .from('registrations')
                .select('team_id, team_name, captain, email, captain_mobile, members')
                .or(`email.ilike.%${cleanQuery}%,captain_mobile.ilike.%${cleanQuery}%`)
                .limit(5);

            if (error) {
                console.error('Lookup query error:', error);
                return NextResponse.json({ success: false, error: 'Database search error.' }, { status: 500 });
            }

            // Also check members array if not matched on captain
            let results = matches || [];
            if (results.length === 0) {
                const { data: allTeams } = await supabase
                    .from('registrations')
                    .select('team_id, team_name, captain, email, captain_mobile, members')
                    .limit(2000);

                if (allTeams) {
                    results = allTeams.filter(t => {
                        if (Array.isArray(t.members)) {
                            return t.members.some((m: any) =>
                                (m?.email && String(m.email).toLowerCase().includes(cleanQuery)) ||
                                (m?.phone && String(m.phone).includes(cleanQuery))
                            );
                        }
                        return false;
                    });
                }
            }

            if (results.length === 0) {
                return NextResponse.json({
                    success: false,
                    error: `No registration found matching "${query}". Please check the spelling or ask your Team Lead.`
                }, { status: 404 });
            }

            // Mask results for privacy
            const masked = results.map(r => ({
                teamId: r.team_id,
                teamName: r.team_name,
                captainName: r.captain,
                maskedEmail: r.email ? r.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : '',
                maskedPhone: r.captain_mobile ? r.captain_mobile.replace(/(\d{2})(\d+)(\d{2})/, '$1******$3') : ''
            }));

            // Optionally auto-dispatch magic link to the registered captain email if requested
            if (body.sendMagicLink && results[0]?.email) {
                const team = results[0];
                const token = generateRosterToken(team.team_id, team.email);
                const magicUrl = `https://tricity.online/edit-registration?teamId=${encodeURIComponent(team.team_id)}&token=${encodeURIComponent(token)}`;

                await sendEmail({
                    to: team.email,
                    subject: `[ACCESS LINK] Your Tri-City Hackathon Roster Link (${team.team_id})`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
                            <div style="background: #0f172a; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
                                <h2 style="color: #14b8a6; margin: 0; font-size: 20px;">ROSTER ACCESS LINK</h2>
                                <p style="color: #94a3b8; font-size: 12px; margin: 6px 0 0 0;">Team ID: ${team.team_id}</p>
                            </div>
                            <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; background: #ffffff;">
                                <p>Hello <strong>${team.captain}</strong>,</p>
                                <p>Here is your secure, direct access link to manage team <strong>"${team.team_name}"</strong>:</p>
                                <div style="text-align: center; margin: 24px 0;">
                                    <a href="${magicUrl}" style="background: #14b8a6; color: #000000; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 10px; display: inline-block; font-size: 14px;">
                                        Open My Team Roster
                                    </a>
                                </div>
                                <p style="font-size: 11px; color: #64748b;">
                                    This link is private to the Team Lead. Do not share it with people outside your team.
                                </p>
                            </div>
                        </div>
                    `
                });

                return NextResponse.json({
                    success: true,
                    message: `Found your team! A private access link has been emailed to ${masked[0].maskedEmail}.`,
                    results: masked
                });
            }

            return NextResponse.json({
                success: true,
                results: masked
            });
        }

        // ══════════════ ACTION: AUTHENTICATE & ACCESS ROSTER ══════════════
        const { teamId, token, captainContact } = body;
        if (!teamId || typeof teamId !== 'string') {
            return NextResponse.json({ success: false, error: 'Team ID is required.' }, { status: 400 });
        }

        const normalizedTeamId = teamId.trim().toUpperCase();

        const portalMode = await getParticipantPortalMode();
        // Allow access in 'edit' or 'event' mode (or if admin override is on)

        const { data: team, error } = await supabase
            .from('registrations')
            .select('*')
            .eq('team_id', normalizedTeamId)
            .maybeSingle();

        if (error || !team) {
            return NextResponse.json({ success: false, error: `Team ID "${normalizedTeamId}" not found.` }, { status: 404 });
        }

        if (['REJECTED', 'MERGED'].includes(String(team.status).toUpperCase())) {
            return NextResponse.json({
                success: false,
                error: `This team registration has been marked as ${team.status}. ${team.merged_into ? `Merged into Team ${team.merged_into}.` : ''}`
            }, { status: 403 });
        }

        let isVerified = false;

        // Verification Method 1: Magic Link Token
        if (token && typeof token === 'string') {
            const matchesLeadEmail = verifyRosterToken(normalizedTeamId, team.email || '', token);
            const matchesLeadPhone = verifyRosterToken(normalizedTeamId, team.captain_mobile || '', token);
            if (matchesLeadEmail || matchesLeadPhone) {
                isVerified = true;
            }
        }

        // Verification Method 2: Captain Email or Phone Dual Factor
        if (!isVerified && captainContact && typeof captainContact === 'string') {
            const cleanContact = captainContact.trim().toLowerCase();
            const teamEmail = (team.email || '').trim().toLowerCase();
            const teamPhone = (team.captain_mobile || '').trim();

            if (teamEmail === cleanContact || teamPhone.endsWith(cleanContact) || cleanContact.endsWith(teamPhone)) {
                isVerified = true;
            }
        }

        if (!isVerified) {
            return NextResponse.json({
                success: false,
                error: 'Verification failed. Please enter the registered Team Captain email or 10-digit mobile number.'
            }, { status: 401 });
        }

        // Check for any pending merge proposals awaiting this team's response
        const pendingMerge = await getPendingMergeForTeam(normalizedTeamId);

        // Set session cookie for this verified team
        const responseData = {
            success: true,
            team: {
                teamId: team.team_id,
                teamName: team.team_name,
                track: team.track || '',
                captain: team.captain || '',
                captainMobile: team.captain_mobile || '',
                college: team.college || '',
                email: team.email || '',
                members: team.members || [],
                status: team.status || 'PENDING',
                problemStatement: team.problem_statement || '',
                createdAt: team.created_at,
                room: team.room || '',
                isCheckedIn: team.is_checked_in || false
            },
            portalMode,
            pendingMerge
        };

        const response = NextResponse.json(responseData);
        return setSessionCookie(response, {
            role: 'team',
            id: team.team_id,
            teamId: team.team_id,
            name: team.team_name,
            portalMode
        });

    } catch (err: unknown) {
        console.error('Verify Access Error:', err);
        const message = err instanceof Error ? err.message : 'Internal verification failure.';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
