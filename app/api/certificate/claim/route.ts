import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import {
    getCertificateConfig,
    evaluateWindowState,
    hasTeamSubmittedFeedback,
    claimCertificateForMember
} from '@/lib/certificate';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const session = getSession(req);
        if (!session || (session.role !== 'team' && session.role !== 'admin')) {
            return NextResponse.json({ success: false, error: 'Unauthorized: Team session required' }, { status: 401 });
        }

        const body = await req.json();
        const teamId = (session.role === 'team' ? session.teamId : body.team_id || session.teamId)?.trim().toUpperCase();
        const memberIndex = Number(body.member_index) || 0;
        const memberName = String(body.member_name || '').trim();

        if (!teamId || !memberName) {
            return NextResponse.json({ success: false, error: 'Team ID and Member Name are required' }, { status: 400 });
        }

        // 1. Verify window state
        const config = await getCertificateConfig();
        const windowState = evaluateWindowState(config);
        if (!windowState.is_open && session.role !== 'admin') {
            return NextResponse.json({ success: false, error: windowState.lock_reason || 'Certificate window is closed.' }, { status: 403 });
        }

        // 2. Fetch team registration
        const { data: team, error } = await supabase
            .from('registrations')
            .select('team_id, team_name, is_checked_in, captain, email, members, raw_data')
            .eq('team_id', teamId)
            .maybeSingle();

        if (error || !team) {
            return NextResponse.json({ success: false, error: 'Team not found.' }, { status: 404 });
        }

        // 3. Verify Check-in
        const isCheckedIn = Boolean(team.is_checked_in || team.raw_data?.checkedInAt);
        if (config.require_checkin && !isCheckedIn && session.role !== 'admin') {
            return NextResponse.json({
                success: false,
                error: 'Only checked-in teams are eligible to claim certificates.'
            }, { status: 403 });
        }

        // 4. Verify Feedback
        if (config.require_feedback && session.role !== 'admin') {
            const hasFeedback = await hasTeamSubmittedFeedback(teamId);
            if (!hasFeedback) {
                return NextResponse.json({
                    success: false,
                    error: 'Please submit the hackathon feedback form before claiming certificates.'
                }, { status: 403 });
            }
        }

        // 5. Generate and persist claim
        const claim = await claimCertificateForMember({
            team_id: team.team_id,
            team_name: team.team_name,
            member_name: memberName,
            member_email: body.member_email || '',
            member_index: memberIndex,
            role: memberIndex === 0 ? 'Team Lead' : 'Team Member'
        });

        return NextResponse.json({
            success: true,
            claim,
            verification_url: `/verify/${claim.certificate_id}`,
            config: {
                event_title: config.event_title,
                issuer_name: config.issuer_name,
                issue_date: config.issue_date,
                signatory_1_name: config.signatory_1_name,
                signatory_1_title: config.signatory_1_title,
                signatory_2_name: config.signatory_2_name,
                signatory_2_title: config.signatory_2_title,
                custom_subtitle: config.custom_subtitle
            }
        });
    } catch (err: unknown) {
        console.error('Certificate Claim POST Error:', err);
        const message = err instanceof Error ? err.message : 'Failed to claim certificate';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
