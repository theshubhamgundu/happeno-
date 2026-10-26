import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import {
    getCertificateConfig,
    evaluateWindowState,
    hasTeamSubmittedFeedback,
    generateCertificateMetadata,
    getNormalizedTeamMembers
} from '@/lib/certificate';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = getSession(req);
        const config = await getCertificateConfig();
        const windowState = evaluateWindowState(config);

        const responseData: any = {
            success: true,
            config: {
                is_enabled: config.is_enabled,
                unlock_at: config.unlock_at,
                require_feedback: config.require_feedback,
                require_checkin: config.require_checkin,
                event_title: config.event_title,
                issuer_name: config.issuer_name,
                issue_date: config.issue_date,
                signatory_1_name: config.signatory_1_name,
                signatory_1_title: config.signatory_1_title,
                signatory_2_name: config.signatory_2_name,
                signatory_2_title: config.signatory_2_title,
                custom_subtitle: config.custom_subtitle
            },
            window: windowState,
            teamStatus: null
        };

        // If authenticated as a team, fetch specific team progress
        if (session && session.role === 'team' && session.teamId) {
            const teamId = session.teamId.trim().toUpperCase();

            const { data: team, error } = await supabase
                .from('registrations')
                .select('team_id, team_name, is_checked_in, captain, captain_mobile, email, members, raw_data')
                .eq('team_id', teamId)
                .maybeSingle();

            if (team) {
                const hasFeedback = await hasTeamSubmittedFeedback(teamId);
                const isCheckedIn = Boolean(team.is_checked_in || team.raw_data?.checkedInAt);

                // Determine gating
                let canClaim = windowState.is_open;
                let lockReason = windowState.lock_reason;

                if (windowState.is_open) {
                    if (config.require_checkin && !isCheckedIn) {
                        canClaim = false;
                        lockReason = 'Your team must be marked as Checked-In by event volunteers to claim certificates.';
                    } else if (config.require_feedback && !hasFeedback) {
                        canClaim = false;
                        lockReason = 'Please complete the Hackathon Feedback Form below to unlock your certificates.';
                    }
                }

                // Prepare normalized and deduplicated member list
                const membersList = getNormalizedTeamMembers(team);

                const membersWithCerts = membersList.map((m) => {
                    const meta = generateCertificateMetadata(team.team_id, m.index, m.name);
                    return {
                        ...m,
                        certificate_id: meta.certificate_id,
                        verification_hash: meta.verification_hash
                    };
                });

                responseData.teamStatus = {
                    team_id: team.team_id,
                    team_name: team.team_name,
                    is_checked_in: isCheckedIn,
                    has_submitted_feedback: hasFeedback,
                    can_claim: canClaim,
                    lock_reason: lockReason,
                    members: membersWithCerts
                };
            }
        }

        return NextResponse.json(responseData);
    } catch (err: unknown) {
        console.error('Certificate Status GET Error:', err);
        const message = err instanceof Error ? err.message : 'Failed to fetch certificate status';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
