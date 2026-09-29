import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession, hasRole } from '@/lib/session';
import { MAX_TEAM_MEMBERS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const session = getSession(req);
    if (!hasRole(session, ['team']) || !session.teamId) {
        return NextResponse.json({ error: 'Participant authentication required.' }, { status: 401 });
    }

    try {
        const { data, error } = await supabase
            .from('registrations')
            .select('team_id, team_name, track, captain, captain_mobile, college, email, members, status, problem_statement, created_at')
            .eq('team_id', session.teamId)
            .maybeSingle();
        if (error) throw error;
        if (!data) return NextResponse.json({ error: 'Registration not found.' }, { status: 404 });

        return NextResponse.json({
            success: true,
            team: {
                teamId: data.team_id,
                teamName: data.team_name,
                track: data.track || '',
                captain: data.captain || '',
                captainMobile: data.captain_mobile || '',
                college: data.college || '',
                email: data.email || '',
                members: data.members || [],
                status: data.status || 'PENDING',
                problemStatement: data.problem_statement || '',
                createdAt: data.created_at
            }
        }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        console.error('Participant lookup failed:', error);
        return NextResponse.json({ error: 'Could not load registration from Supabase.' }, { status: 503 });
    }
}

export async function PATCH(req: Request) {
    const session = getSession(req);
    if (!hasRole(session, ['team']) || !session.teamId) {
        return NextResponse.json({ error: 'Participant authentication required.' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const allowedKeys = new Set(['teamId', 'teamName', 'track', 'captain', 'captainMobile', 'college', 'email', 'members']);
        if (Object.keys(body).some(key => !allowedKeys.has(key))) {
            return NextResponse.json({ error: 'Request contains fields that participants cannot update.' }, { status: 403 });
        }
        if (body.teamId && body.teamId !== session.teamId) {
            return NextResponse.json({ error: 'You can only update your own team.' }, { status: 403 });
        }

        const members = body.members;
        if (members !== undefined && (!Array.isArray(members) || members.length > MAX_TEAM_MEMBERS)) {
            return NextResponse.json({ error: `Teams are limited to ${MAX_TEAM_MEMBERS} participants.` }, { status: 400 });
        }

        const updateData: Record<string, unknown> = {};
        if (body.teamName !== undefined) updateData.team_name = String(body.teamName).trim();
        if (body.track !== undefined) updateData.track = String(body.track).trim();
        if (body.captain !== undefined) updateData.captain = String(body.captain).trim();
        if (body.captainMobile !== undefined) updateData.captain_mobile = String(body.captainMobile).trim();
        if (body.college !== undefined) updateData.college = String(body.college).trim();
        if (body.email !== undefined) updateData.email = String(body.email).trim();
        if (members !== undefined) updateData.members = members;
        if (!Object.keys(updateData).length) {
            return NextResponse.json({ error: 'No fields to update.' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('registrations')
            .update(updateData)
            .eq('team_id', session.teamId)
            .select('team_id')
            .maybeSingle();
        if (error) throw error;
        if (!data) return NextResponse.json({ error: 'Registration not found.' }, { status: 404 });

        return NextResponse.json({ success: true, message: 'Details updated successfully.' });
    } catch (error) {
        console.error('Participant update failed:', error);
        return NextResponse.json({ error: 'Could not update registration in Supabase.' }, { status: 503 });
    }
}
