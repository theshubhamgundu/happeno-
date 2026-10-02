import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession, hasRole } from '@/lib/session';
import { getParticipantPortalMode } from '@/lib/event-windows';
import { MAX_TEAM_MEMBERS } from '@/lib/constants';
import {
    recordRosterAudit,
    createMergeInvite,
    submitMergeRequest,
    getMergeInvite,
    rateLimitRosterAction
} from '@/lib/roster-security';
import { sendEmail } from '@/lib/email';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

    // Verify session
    const session = getSession(req);
    if (!hasRole(session, ['team', 'admin']) || !session.teamId) {
        return NextResponse.json({ error: 'Team lead authentication required.' }, { status: 401 });
    }

    const teamId = session.teamId;

    // Verify window
    const portalMode = session.portalMode || await getParticipantPortalMode();
    const isDevelopment = process.env.NODE_ENV !== 'production';
    let requestedAction = '';
    try {
        const previewBody = await req.clone().json();
        requestedAction = typeof previewBody?.action === 'string' ? previewBody.action : '';
    } catch {
        // The normal request parsing below returns the validation response.
    }
    const isMergeAction = ['create_merge_code', 'submit_merge_code', 'respond_merge'].includes(requestedAction);
    if (!isDevelopment && portalMode !== 'edit' && !hasRole(session, ['admin']) && !isMergeAction) {
        return NextResponse.json({
            error: 'Roster editing is only available during the Team Correction Window (Oct 5–6).'
        }, { status: 403 });
    }

    // Rate limit
    const allowed = await rateLimitRosterAction(ip, 20, 600);
    if (!allowed) {
        return NextResponse.json({ error: 'Too many requests. Please wait a few minutes.' }, { status: 429 });
    }

    try {
        const body = await req.json();
        const { action } = body;

        // Fetch current team state
        const { data: team, error: fetchErr } = await supabase
            .from('registrations')
            .select('*')
            .eq('team_id', teamId)
            .maybeSingle();

        if (fetchErr || !team) {
            return NextResponse.json({ error: 'Team not found in database.' }, { status: 404 });
        }

        const rawData = (team.raw_data && typeof team.raw_data === 'object') ? (team.raw_data as any) : {};
        const replacementCount = Number(rawData.member_replacements_count || 0);
        const isRosterLocked = Boolean(rawData.roster_locked || rawData.locked || team.is_locked);

        // One-time edit enforcement: if already locked and not admin, reject all mutations
        if (isRosterLocked && !hasRole(session, ['admin'])) {
            return NextResponse.json({
                error: 'Your team registration has already been finalized and locked. Only one edit submission is permitted.'
            }, { status: 403 });
        }

        // ══════════════ ACTION 1: UPDATE DETAILS & 1-TIME LOCK ══════════════
        if (action === 'update_details') {
            const { teamName, track, trackPreferences, college, members, finalizeAndLock, lockRoster } = body;

            if (members && Array.isArray(members)) {
                if (members.length === 3) {
                    return NextResponse.json({
                        error: 'Hackathon rules strictly permit Solo (1), Duo (2), or Quad (4) teams. 3-member teams (Tri) are not allowed. Please add a 4th teammate to form a Quad, or adjust to 2 members before saving.'
                    }, { status: 400 });
                }
                if (members.length === 0 || members.length > MAX_TEAM_MEMBERS) {
                    return NextResponse.json({
                        error: `Teams must have 1, 2, or 4 members (cannot exceed ${MAX_TEAM_MEMBERS}).`
                    }, { status: 400 });
                }
            }

            const updates: Record<string, unknown> = {};
            if (teamName) updates.team_name = String(teamName).trim();
            
            const updatedRawData = { ...rawData };

            if (Array.isArray(trackPreferences) && trackPreferences.length > 0) {
                const cleanPrefs = trackPreferences.slice(0, 3).map(String);
                updates.track_preferences = cleanPrefs;
                updates.track = cleanPrefs[0];
                updatedRawData.track_preferences = cleanPrefs;
            } else if (track) {
                updates.track = String(track).trim();
            }
            if (college) updates.college = String(college).trim();
            if (members) updates.members = members;

            const shouldLock = Boolean(finalizeAndLock || lockRoster);
            if (shouldLock) {
                updatedRawData.roster_locked = true;
                updatedRawData.roster_locked_at = new Date().toISOString();
                updatedRawData.roster_edit_count = Number(rawData.roster_edit_count || 0) + 1;
            }

            updates.raw_data = updatedRawData;

            const { error: updateErr } = await supabase
                .from('registrations')
                .update(updates)
                .eq('team_id', teamId);

            if (updateErr) throw updateErr;

            await recordRosterAudit({
                teamId,
                action: shouldLock ? 'FINALIZE_AND_LOCK' : 'UPDATE_DETAILS',
                ip,
                actor: team.email || team.captain || teamId,
                summary: shouldLock
                    ? `Finalized and locked team registration (1-time edit).`
                    : `Updated team details & roster members.`,
                previousState: { team_name: team.team_name, track: team.track, members: team.members },
                newState: updates
            });

            return NextResponse.json({
                success: true,
                isRosterLocked: shouldLock,
                message: shouldLock
                    ? 'Your team registration has been finalized and permanently locked!'
                    : 'Team details updated successfully!'
            });
        }

        // ══════════════ ACTION 2: REPLACE A DROPPED MEMBER ══════════════
        if (action === 'replace_member') {
            const { memberIndex, newMember } = body;

            if (typeof memberIndex !== 'number' || !newMember || !newMember.fullName || !newMember.email) {
                return NextResponse.json({ error: 'Valid member index and replacement details are required.' }, { status: 400 });
            }

            // Anti-Fraud: Limit to max 2 replacements per team
            if (replacementCount >= 2 && !hasRole(session, ['admin'])) {
                return NextResponse.json({
                    error: 'Maximum replacement limit reached (2 members). Please visit the onsite Help Desk for further substitutions.'
                }, { status: 403 });
            }

            const currentMembers = Array.isArray(team.members) ? [...team.members] : [];
            if (memberIndex < 0 || memberIndex >= currentMembers.length) {
                return NextResponse.json({ error: 'Invalid member slot specified.' }, { status: 400 });
            }

            const oldMember = currentMembers[memberIndex];
            const newCleanEmail = String(newMember.email).trim().toLowerCase();

            // Check if new member is already in another team
            const { data: duplicateCheck } = await supabase
                .from('registrations')
                .select('team_id, team_name')
                .eq('email', newCleanEmail)
                .neq('team_id', teamId)
                .maybeSingle();

            if (duplicateCheck) {
                return NextResponse.json({
                    error: `A participant with email ${newCleanEmail} is already registered under team "${duplicateCheck.team_name}" (${duplicateCheck.team_id}).`
                }, { status: 400 });
            }

            // Perform replacement
            currentMembers[memberIndex] = {
                fullName: String(newMember.fullName).trim(),
                email: newCleanEmail,
                phone: String(newMember.phone || '').trim(),
                college: String(newMember.college || team.college || '').trim(),
                department: String(newMember.department || '').trim(),
                year: String(newMember.year || '').trim(),
                replacedAt: new Date().toISOString()
            };

            const updatedRawData = {
                ...rawData,
                member_replacements_count: replacementCount + 1,
                last_replacement_at: new Date().toISOString()
            };

            const { error: repErr } = await supabase
                .from('registrations')
                .update({
                    members: currentMembers,
                    raw_data: updatedRawData
                })
                .eq('team_id', teamId);

            if (repErr) throw repErr;

            await recordRosterAudit({
                teamId,
                action: 'REPLACE_MEMBER',
                ip,
                actor: team.email || team.captain || teamId,
                summary: `Replaced Member #${memberIndex + 1}: ${oldMember?.fullName || oldMember?.name || 'Unnamed'} -> ${newMember.fullName}`,
                previousState: oldMember,
                newState: newMember
            });

            // Instant Email Notifications (Old Member Alert + New Member Welcome)
            try {
                if (oldMember?.email) {
                    await sendEmail({
                        to: oldMember.email,
                        subject: `[NOTICE] Tri-City Hackathon Registration Update (Team ${team.team_name})`,
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
                                <div style="background: #0f172a; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
                                    <h2 style="color: #f59e0b; margin: 0; font-size: 18px;">REGISTRATION STATUS CHANGE</h2>
                                </div>
                                <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; background: #ffffff;">
                                    <p>Hello <strong>${oldMember.fullName || oldMember.name || 'Participant'}</strong>,</p>
                                    <p>Your slot in team <strong>"${team.team_name}" (${teamId})</strong> has been reassigned by Team Lead <strong>${team.captain}</strong>.</p>
                                    <p style="font-size: 12px; color: #64748b;">If this was done by mistake, please contact your Team Lead immediately or reach out to the organizing desk at <strong>business@centle.in</strong>.</p>
                                </div>
                            </div>
                        `
                    });
                }

                if (newCleanEmail) {
                    await sendEmail({
                        to: newCleanEmail,
                        subject: `Welcome to Team "${team.team_name}" - Tri-City AI Hackathon 2026!`,
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
                                <div style="background: #0f172a; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
                                    <h2 style="color: #14b8a6; margin: 0; font-size: 18px;">WELCOME TO TRI-CITY 2026!</h2>
                                </div>
                                <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; background: #ffffff;">
                                    <p>Hello <strong>${newMember.fullName}</strong>,</p>
                                    <p>You have been officially added to <strong>Team "${team.team_name}" (${teamId})</strong> by Team Lead <strong>${team.captain}</strong>!</p>
                                    <p>Hackathon Dates: <strong>October 10–11, 2026</strong>. Digital passes and check-in QR codes will unlock once rosters finalize on October 7.</p>
                                </div>
                            </div>
                        `
                    });
                }
            } catch (mailErr) {
                console.warn('Replacement email notification skipped:', mailErr);
            }

            return NextResponse.json({
                success: true,
                message: `Member replaced successfully. ${2 - (replacementCount + 1)} replacement(s) remaining for this team.`
            });
        }

        // ══════════════ ACTION 3: GENERATE MERGE INVITE CODE ══════════════
        if (action === 'create_merge_code') {
            const memberCount = (team.members && Array.isArray(team.members)) ? team.members.length : 1;
            if (memberCount >= 4) {
                return NextResponse.json({
                    error: 'Your team already has 4 members (Quad) and cannot merge further.'
                }, { status: 400 });
            }
            if (memberCount === 3) {
                return NextResponse.json({
                    error: 'Cannot merge: Solo (1) + Duo (2) = 3 members is prohibited. Agency rules allow Solo (1), Duo (2), or Quad (4) teams only. If a Solo and Duo want to merge, a 4th teammate must be added to reach a full Quad (4).'
                }, { status: 400 });
            }

            const code = await createMergeInvite({
                id: team.team_id,
                name: team.team_name,
                captain: team.captain,
                email: team.email,
                memberCount
            });

            return NextResponse.json({
                success: true,
                code,
                expiresInMinutes: 30,
                message: `Temporary merge code generated: ${code}. Share this with the other Team Lead.`
            });
        }

        // ══════════════ ACTION 4: ENTER MERGE CODE TO SUBMIT REQUEST ══════════════
        if (action === 'submit_merge_code') {
            const { code } = body;
            if (!code || typeof code !== 'string') {
                return NextResponse.json({ error: 'Please enter a 6-digit merge code.' }, { status: 400 });
            }

            const targetMemberCount = (team.members && Array.isArray(team.members)) ? team.members.length : 1;
            if (targetMemberCount >= 4) {
                return NextResponse.json({ error: 'Your team is already at max capacity (4 members).' }, { status: 400 });
            }
            if (targetMemberCount === 3) {
                return NextResponse.json({
                    error: 'Cannot merge: Solo (1) + Duo (2) = 3 members is prohibited. Agency rules allow Solo (1), Duo (2), or Quad (4) teams only. If a Solo and Duo want to merge, a 4th teammate must be added to reach a full Quad (4).'
                }, { status: 400 });
            }

            const result = await submitMergeRequest(code, {
                id: team.team_id,
                name: team.team_name,
                captain: team.captain,
                email: team.email,
                memberCount: targetMemberCount
            });

            if (!result.success) {
                return NextResponse.json({ error: result.message }, { status: 400 });
            }

            return NextResponse.json({
                success: true,
                message: result.message
            });
        }

        // ══════════════ ACTION 5: RESPOND TO PENDING MERGE PROPOSAL (APPROVE / REJECT) ══════════════
        if (action === 'respond_merge') {
            const { code, decision } = body; // decision: 'APPROVE' | 'REJECT'
            const proposal = await getMergeInvite(code);

            if (!proposal || proposal.sourceTeamId !== teamId) {
                return NextResponse.json({ error: 'No active merge proposal found for your approval.' }, { status: 404 });
            }

            if (decision === 'REJECT') {
                if (redis) {
                    await redis.del(`roster_merge:${code}`);
                    await redis.del(`roster_pending_merge:${teamId}`);
                }
                return NextResponse.json({ success: true, message: 'Merge proposal rejected.' });
            }

            if (decision === 'APPROVE') {
                if (!proposal.targetTeamId) {
                    return NextResponse.json({ error: 'No requesting team attached to this proposal.' }, { status: 400 });
                }

                // Fetch target team
                const { data: targetTeam } = await supabase
                    .from('registrations')
                    .select('*')
                    .eq('team_id', proposal.targetTeamId)
                    .maybeSingle();

                if (!targetTeam) {
                    return NextResponse.json({ error: 'Target team could not be found.' }, { status: 404 });
                }

                const targetRawData = (targetTeam.raw_data && typeof targetTeam.raw_data === 'object') ? (targetTeam.raw_data as any) : {};
                if (targetRawData.roster_locked && !hasRole(session, ['admin'])) {
                    return NextResponse.json({
                        error: `Target Team "${targetTeam.team_name}" has already finalized and locked their registration.`
                    }, { status: 403 });
                }

                const sourceMembers = Array.isArray(team.members) ? team.members : [];
                const targetMembers = Array.isArray(targetTeam.members) ? targetTeam.members : [];
                const mergedMembers = [...sourceMembers, ...targetMembers];

                if (mergedMembers.length === 3) {
                    return NextResponse.json({
                        error: 'Cannot merge: Solo (1) + Duo (2) = 3 members is prohibited. Agency rules allow Solo (1), Duo (2), or Quad (4) teams only. If a Solo and Duo want to merge, a 4th teammate must be added to reach a full Quad (4).'
                    }, { status: 400 });
                }

                if (mergedMembers.length > MAX_TEAM_MEMBERS) {
                    return NextResponse.json({
                        error: `Combined team has ${mergedMembers.length} members, exceeding the ${MAX_TEAM_MEMBERS} cap.`
                    }, { status: 400 });
                }

                // Preserve and merge member meal states
                const sourceMealState = (team.member_meal_state && typeof team.member_meal_state === 'object') ? team.member_meal_state : {};
                const targetMealState = (targetTeam.member_meal_state && typeof targetTeam.member_meal_state === 'object') ? targetTeam.member_meal_state : {};
                const mergedMealState = { ...sourceMealState, ...targetMealState };

                // Update Source Team (keeps active)
                const { error: srcErr } = await supabase
                    .from('registrations')
                    .update({
                        members: mergedMembers,
                        team_name: `${team.team_name} & ${targetTeam.team_name}`.slice(0, 50),
                        member_meal_state: mergedMealState,
                        raw_data: {
                            ...rawData,
                            merged_from_team_id: targetTeam.team_id,
                            merged_at: new Date().toISOString()
                        }
                    })
                    .eq('team_id', team.team_id);

                if (srcErr) throw srcErr;

                // Archive Target Team (marks as MERGED)
                await supabase
                    .from('registrations')
                    .update({
                        status: 'MERGED',
                        merged_into: team.team_id,
                        raw_data: {
                            ...targetRawData,
                            merged_into_team_id: team.team_id,
                            merged_at: new Date().toISOString()
                        }
                    })
                    .eq('team_id', targetTeam.team_id);

                // Clean up merge tokens
                if (redis) {
                    await redis.del(`roster_merge:${code}`);
                    await redis.del(`roster_pending_merge:${teamId}`);
                }

                await recordRosterAudit({
                    teamId: team.team_id,
                    action: 'MERGE_TEAMS',
                    ip,
                    actor: team.email || team.captain || teamId,
                    summary: `Successfully merged Team ${targetTeam.team_name} (${targetTeam.team_id}) into Team ${team.team_name} (${team.team_id}). Total members: ${mergedMembers.length}.`,
                    previousState: { sourceMembersCount: sourceMembers.length, targetMembersCount: targetMembers.length },
                    newState: { mergedTeamId: team.team_id, totalMembers: mergedMembers.length }
                });

                return NextResponse.json({
                    success: true,
                    message: `Teams successfully merged into "${team.team_name}" with ${mergedMembers.length} total members!`
                });
            }

            return NextResponse.json({ error: 'Invalid decision.' }, { status: 400 });
        }

        return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });

    } catch (err: unknown) {
        console.error('Roster Action Error:', err);
        const message = err instanceof Error ? err.message : 'Failed to process roster action.';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
