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
                .select('team_id, team_name, captain, email, captain_mobile, members, status, merged_into, raw_data')
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
                    .select('team_id, team_name, captain, email, captain_mobile, members, status, merged_into, raw_data')
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

            // Resolve any merged teams to their active combo team
            const resolvedResults: typeof results = [];
            const seenIds = new Set<string>();

            for (const r of results) {
                if (String(r.status).toUpperCase() === 'MERGED') {
                    const raw = (r.raw_data && typeof r.raw_data === 'object') ? (r.raw_data as any) : {};
                    const targetId = r.merged_into || raw.merged_into_team_id;
                    if (targetId) {
                        const { data: targetActive } = await supabase
                            .from('registrations')
                            .select('team_id, team_name, captain, email, captain_mobile, members, status, merged_into, raw_data')
                            .eq('team_id', String(targetId).trim().toUpperCase())
                            .maybeSingle();
                        if (targetActive && !seenIds.has(targetActive.team_id)) {
                            seenIds.add(targetActive.team_id);
                            resolvedResults.push(targetActive);
                            continue;
                        }
                    }
                }
                if (!seenIds.has(r.team_id)) {
                    seenIds.add(r.team_id);
                    resolvedResults.push(r);
                }
            }

            const finalResults = resolvedResults.length > 0 ? resolvedResults : results;

            // Mask results for privacy
            const masked = finalResults.map(r => ({
                teamId: r.team_id,
                teamName: r.team_name,
                captainName: r.captain,
                maskedEmail: r.email ? r.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : '',
                maskedPhone: r.captain_mobile ? r.captain_mobile.replace(/(\d{2})(\d+)(\d{2})/, '$1******$3') : ''
            }));

            // Optionally auto-dispatch magic link to the registered captain email if requested
            if (body.sendMagicLink && finalResults[0]?.email) {
                const team = results[0];
                const token = generateRosterToken(team.team_id, team.email);
                const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://happeno.in').replace(/\/+$/, '');
                const magicUrl = `${appUrl}/help?teamId=${encodeURIComponent(team.team_id)}&token=${encodeURIComponent(token)}`;

                await sendEmail({
                    to: team.email,
                    subject: `[ACCESS LINK] Your Happeno Hackathon Roster Link (${team.team_id})`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
                            <div style="background: #0f172a; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
                                <h2 style="color: #ea580c; margin: 0; font-size: 20px;">ROSTER ACCESS LINK</h2>
                                <p style="color: #94a3b8; font-size: 12px; margin: 6px 0 0 0;">Team ID: ${team.team_id}</p>
                            </div>
                            <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; background: #ffffff;">
                                <p>Hello <strong>${team.captain}</strong>,</p>
                                <p>Here is your secure, direct access link to manage team <strong>"${team.team_name}"</strong>:</p>
                                <div style="text-align: center; margin: 24px 0;">
                                    <a href="${magicUrl}" style="background: #ea580c; color: #000000; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 10px; display: inline-block; font-size: 14px;">
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

        const currentMode = await getParticipantPortalMode();
        let portalMode = currentMode;
        
        // Agency testing bypass
        if (normalizedTeamId === 'TRI26002') {
            portalMode = 'event';
        }
        
        if (portalMode === 'closed') {
            return NextResponse.json({ success: false, error: 'The participant portal is currently closed. Please check back during the designated windows.' }, { status: 403 });
        }

        const { data: team, error } = await supabase
            .from('registrations')
            .select('*')
            .eq('team_id', normalizedTeamId)
            .maybeSingle();

        if (error || !team) {
            return NextResponse.json({ success: false, error: `Team ID "${normalizedTeamId}" not found.` }, { status: 404 });
        }

        let activeTeam = team;
        let isRedirectedFromMerged = false;
        const originalTeamId = normalizedTeamId;

        // Recover older merges whose source rows were not marked MERGED successfully.
        if (String(team.status).toUpperCase() !== 'MERGED') {
            const { data: comboTeam, error: comboErr } = await supabase
                .from('registrations')
                .select('*')
                .eq('status', 'COMPLETED')
                .contains('raw_data', { merged_from_teams: [normalizedTeamId] })
                .maybeSingle();
            if (comboTeam && !comboErr) {
                activeTeam = comboTeam;
                isRedirectedFromMerged = true;
            }
        }

        // If this team was merged into another team, seamlessly follow the pointer to the active combo team
        if (!isRedirectedFromMerged && String(team.status).toUpperCase() === 'MERGED') {
            const raw = (team.raw_data && typeof team.raw_data === 'object') ? (team.raw_data as any) : {};
            const targetId = raw.merged_into_team_id;

            if (targetId) {
                const { data: comboTeam, error: comboErr } = await supabase
                    .from('registrations')
                    .select('*')
                    .eq('team_id', String(targetId).trim().toUpperCase())
                    .maybeSingle();

                if (comboTeam && !comboErr) {
                    activeTeam = comboTeam;
                    isRedirectedFromMerged = true;
                }
            }

            if (!isRedirectedFromMerged) {
                const { data: comboTeam, error: comboErr } = await supabase
                    .from('registrations')
                    .select('*')
                    .eq('status', 'COMPLETED')
                    .contains('raw_data', { merged_from_teams: [normalizedTeamId] })
                    .maybeSingle();
                if (comboTeam && !comboErr) {
                    activeTeam = comboTeam;
                    isRedirectedFromMerged = true;
                }
            }

            if (!isRedirectedFromMerged) {
                return NextResponse.json({
                    success: false,
                    error: `Team "${normalizedTeamId}" was merged, but the combined team record could not be found. Please contact support.`
                }, { status: 404 });
            }
        } else if (String(team.status).toUpperCase() === 'REJECTED') {
            return NextResponse.json({
                success: false,
                error: 'This team registration has been rejected.'
            }, { status: 403 });
        }

        let isVerified = false;

        const phoneMatches = (p1?: string, p2?: string) => {
            if (!p1 || !p2) return false;
            const c1 = p1.replace(/\D/g, '').slice(-10);
            const c2 = p2.replace(/\D/g, '').slice(-10);
            return c1.length >= 7 && c2.length >= 7 && c1 === c2;
        };

        // Verification Method 1: Magic Link Token
        if (token && typeof token === 'string') {
            const matchesLeadEmail = verifyRosterToken(normalizedTeamId, team.email || '', token) ||
                                     verifyRosterToken(activeTeam.team_id, activeTeam.email || '', token);
            const matchesLeadPhone = verifyRosterToken(normalizedTeamId, team.captain_mobile || '', token) ||
                                     verifyRosterToken(activeTeam.team_id, activeTeam.captain_mobile || '', token);
            if (matchesLeadEmail || matchesLeadPhone) {
                isVerified = true;
            }
        }

        // Verification Method 2: Team Lead Phone Number ONLY
        if (!isVerified && captainContact && typeof captainContact === 'string') {
            const cleanContact = captainContact.trim();

            // Only match against original team lead's phone number
            const origPhone = (team.captain_mobile || '').trim();
            if (phoneMatches(origPhone, cleanContact)) {
                isVerified = true;
            }

            // Also match against active combo team lead's phone (for merged teams)
            if (!isVerified) {
                const activePhone = (activeTeam.captain_mobile || '').trim();
                if (phoneMatches(activePhone, cleanContact)) {
                    isVerified = true;
                }
            }
        }

        if (!isVerified) {
            return NextResponse.json({
                success: false,
                error: 'Verification failed. Please enter the registered Team Lead 10-digit phone number.'
            }, { status: 401 });
        }

        // Check for any pending merge proposals awaiting this team's response
        const pendingMerge = await getPendingMergeForTeam(activeTeam.team_id);

        const rawData = (activeTeam.raw_data && typeof activeTeam.raw_data === 'object') ? (activeTeam.raw_data as any) : {};
        const isRosterLocked = Boolean(rawData.roster_locked || rawData.locked || activeTeam.is_locked);
        const rosterLockedAt = rawData.roster_locked_at || null;

        // Set session cookie for this verified team
        const responseData = {
            success: true,
            isRedirectedFromMerged,
            originalTeamId,
            message: isRedirectedFromMerged
                ? `Team ${originalTeamId} has merged into "${activeTeam.team_name}" (${activeTeam.team_id}). Loaded merged team details!`
                : undefined,
            team: {
                teamId: activeTeam.team_id,
                teamName: activeTeam.team_name,
                track: activeTeam.track || '',
                trackPreferences: activeTeam.track_preferences || (activeTeam.raw_data && (activeTeam.raw_data as any).track_preferences) || (activeTeam.track ? [activeTeam.track] : []),
                captain: activeTeam.captain || '',
                captainMobile: activeTeam.captain_mobile || '',
                college: activeTeam.college || '',
                email: activeTeam.email || '',
                members: activeTeam.members || [],
                status: activeTeam.status || 'PENDING',
                problemStatement: activeTeam.problem_statement || '',
                createdAt: activeTeam.created_at,
                room: activeTeam.room || '',
                isCheckedIn: activeTeam.is_checked_in || false,
                isRosterLocked,
                rosterLockedAt
            },
            portalMode,
            pendingMerge
        };

        const response = NextResponse.json(responseData);
        return setSessionCookie(response, {
            role: 'team',
            id: activeTeam.team_id,
            teamId: activeTeam.team_id,
            name: activeTeam.team_name,
            portalMode
        });

    } catch (err: unknown) {
        console.error('Verify Access Error:', err);
        const message = err instanceof Error ? err.message : 'Internal verification failure.';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
