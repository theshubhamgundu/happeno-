import { NextResponse } from 'next/server';
import { getSession, hasRole } from '@/lib/session';
import {
    getCertificateConfig,
    updateCertificateConfig,
    evaluateWindowState,
    getFeedbackAnalytics
} from '@/lib/certificate';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const session = getSession(req);
    if (!hasRole(session, ['admin'])) {
        return NextResponse.json({ success: false, error: 'Admin authorization required' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const exportCsv = searchParams.get('export') === 'csv';

        const config = await getCertificateConfig();
        const windowState = evaluateWindowState(config);
        const analytics = await getFeedbackAnalytics();

        if (exportCsv) {
            // Generate CSV
            const headers = ['Team ID', 'Team Name', 'Submitter Name', 'Submitter Email', 'Overall (1-5)', 'Organization (1-5)', 'Mentorship (1-5)', 'Judging (1-5)', 'Food/Venue (1-5)', 'Highlight', 'Feedback Text'];
            const rows = analytics.recentFeedbacks.map(f => [
                f.team_id,
                `"${(f.team_name || '').replace(/"/g, '""')}"`,
                `"${(f.submitted_by_name || '').replace(/"/g, '""')}"`,
                `"${(f.submitted_by_email || '').replace(/"/g, '""')}"`,
                f.rating_overall,
                f.rating_organization,
                f.rating_mentorship,
                f.rating_judging,
                f.rating_food,
                `"${(f.highlight || '').replace(/"/g, '""')}"`,
                `"${(f.feedback_text || '').replace(/"/g, '""')}"`
            ]);

            const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

            return new Response(csvContent, {
                status: 200,
                headers: {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': `attachment; filename="happeno_hackathon_feedback_${new Date().toISOString().split('T')[0]}.csv"`
                }
            });
        }

        return NextResponse.json({
            success: true,
            config,
            window: windowState,
            analytics
        });
    } catch (err: unknown) {
        console.error('Admin Certificate Settings GET Error:', err);
        const message = err instanceof Error ? err.message : 'Failed to retrieve settings';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = getSession(req);
    if (!hasRole(session, ['admin'])) {
        return NextResponse.json({ success: false, error: 'Admin authorization required' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { action } = body;

        if (action === 'unlock_now') {
            const updated = await updateCertificateConfig({
                is_enabled: true,
                unlock_at: null // immediate
            });
            return NextResponse.json({
                success: true,
                message: 'Certificate window is now unlocked and open to participants.',
                config: updated
            });
        }

        if (action === 'lock_now') {
            const updated = await updateCertificateConfig({
                is_enabled: false,
                unlock_at: null
            });
            return NextResponse.json({
                success: true,
                message: 'Certificate claiming is now locked.',
                config: updated
            });
        }

        // Generic patch
        const patch: Record<string, any> = {};
        if (typeof body.is_enabled === 'boolean') patch.is_enabled = body.is_enabled;
        if (body.unlock_at !== undefined) patch.unlock_at = body.unlock_at;
        if (typeof body.require_feedback === 'boolean') patch.require_feedback = body.require_feedback;
        if (typeof body.require_checkin === 'boolean') patch.require_checkin = body.require_checkin;
        if (body.event_title) patch.event_title = String(body.event_title).trim();
        if (body.issuer_name) patch.issuer_name = String(body.issuer_name).trim();
        if (body.signatory_1_name) patch.signatory_1_name = String(body.signatory_1_name).trim();
        if (body.signatory_1_title) patch.signatory_1_title = String(body.signatory_1_title).trim();
        if (body.signatory_2_name) patch.signatory_2_name = String(body.signatory_2_name).trim();
        if (body.signatory_2_title) patch.signatory_2_title = String(body.signatory_2_title).trim();
        if (body.issue_date) patch.issue_date = String(body.issue_date).trim();
        if (body.custom_subtitle) patch.custom_subtitle = String(body.custom_subtitle).trim();

        const updated = await updateCertificateConfig(patch);

        return NextResponse.json({
            success: true,
            message: 'Certificate settings updated successfully.',
            config: updated
        });
    } catch (err: unknown) {
        console.error('Admin Certificate Settings POST Error:', err);
        const message = err instanceof Error ? err.message : 'Failed to update settings';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
