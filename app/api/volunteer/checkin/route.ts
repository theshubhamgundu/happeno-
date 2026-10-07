import { NextResponse } from 'next/server';
import { getSession, hasRole } from '@/lib/session';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const session = getSession(req);
    if (!hasRole(session, ['volunteer', 'admin']) || !session.id) {
        return NextResponse.json({ success: false, error: 'Volunteer or Admin authentication required.' }, { status: 401 });
    }

    try {
        const body = await req.json() as { teamId?: string };
        const teamId = body.teamId?.trim().toUpperCase();

        if (!teamId) {
            return NextResponse.json({ success: false, error: 'Invalid team ID scanned.' }, { status: 400 });
        }

        const { data: team, error: fetchErr } = await supabase
            .from('registrations')
            .select('team_id, team_name, is_checked_in, raw_data')
            .or(`team_id.ilike.${teamId},transaction_id.ilike.${teamId}`)
            .single();

        if (fetchErr || !team) {
            return NextResponse.json({ success: false, error: 'Team not found in database.' }, { status: 404 });
        }

        if (team.is_checked_in || (team.raw_data && typeof team.raw_data === 'object' && 'checkedInAt' in team.raw_data)) {
            return NextResponse.json({ 
                success: true, 
                result: { 
                    status: 'ALREADY_CHECKED_IN',
                    teamId: team.team_id,
                    teamName: team.team_name,
                    checkedInAt: (team.raw_data as Record<string, unknown>)?.checkedInAt
                } 
            });
        }

        const raw_data = team.raw_data && typeof team.raw_data === 'object' ? team.raw_data : {};
        const now = new Date().toISOString();

        const { error: updateErr } = await supabase
            .from('registrations')
            .update({
                is_checked_in: true,
                raw_data: { ...raw_data, checkedInAt: now }
            })
            .eq('team_id', team.team_id);

        if (updateErr) throw updateErr;

        return NextResponse.json({ 
            success: true, 
            result: { 
                status: 'PERMITTED',
                teamId: team.team_id,
                teamName: team.team_name,
                checkedInAt: now
            } 
        });

    } catch (error) {
        console.error('Checkin scan failed:', error);
        return NextResponse.json({ success: false, error: 'Could not process check-in.' }, { status: 500 });
    }
}
