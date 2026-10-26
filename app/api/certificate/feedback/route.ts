import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import { submitCertificateFeedback, getCertificateConfig, evaluateWindowState } from '@/lib/certificate';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const session = getSession(req);
        if (!session || (session.role !== 'team' && session.role !== 'admin')) {
            return NextResponse.json({ success: false, error: 'Unauthorized: Team session required' }, { status: 401 });
        }

        const body = await req.json();
        const teamId = (session.role === 'team' ? session.teamId : body.team_id || session.teamId)?.trim().toUpperCase();

        if (!teamId) {
            return NextResponse.json({ success: false, error: 'Team ID is required' }, { status: 400 });
        }

        // Verify window is enabled
        const config = await getCertificateConfig();
        const windowState = evaluateWindowState(config);
        if (!windowState.is_open && session.role !== 'admin') {
            return NextResponse.json({
                success: false,
                error: windowState.lock_reason || 'Certificate window is currently locked.'
            }, { status: 403 });
        }

        // Fetch team details for context
        const { data: team } = await supabase
            .from('registrations')
            .select('team_name, captain, email')
            .eq('team_id', teamId)
            .maybeSingle();

        const success = await submitCertificateFeedback({
            team_id: teamId,
            team_name: team?.team_name || body.team_name || '',
            submitted_by_name: body.submitted_by_name || team?.captain || 'Team Lead',
            submitted_by_email: body.submitted_by_email || team?.email || '',
            rating_overall: Number(body.rating_overall) || 5,
            rating_organization: Number(body.rating_organization) || 5,
            rating_mentorship: Number(body.rating_mentorship) || 5,
            rating_judging: Number(body.rating_judging) || 5,
            rating_food: Number(body.rating_food) || 5,
            feedback_text: body.feedback_text ? String(body.feedback_text).trim() : '',
            highlight: body.highlight ? String(body.highlight).trim() : ''
        });

        if (!success) {
            return NextResponse.json({ success: false, error: 'Failed to record feedback. Please try again.' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Feedback submitted successfully! Certificate claiming is now unlocked.'
        });
    } catch (err: unknown) {
        console.error('Certificate Feedback POST Error:', err);
        const message = err instanceof Error ? err.message : 'Error submitting feedback';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
