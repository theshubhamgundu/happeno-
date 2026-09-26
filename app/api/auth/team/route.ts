import { NextResponse } from 'next/server';
import { teamSupabase as supabase } from '@/lib/supabase';
import { getLocalTeams } from '@/lib/local-team-store';

export async function POST(req: Request) {
    try {
        const { teamId, password } = await req.json();
        if (typeof teamId !== 'string' || typeof password !== 'string') {
            return NextResponse.json({ success: false, error: 'Team ID and password are required.' }, { status: 400 });
        }

        const { data: databaseTeam, error: databaseError } = await supabase
            .from('registrations')
            .select('team_id, team_name, password')
            .ilike('team_id', teamId.trim())
            .maybeSingle();

        if (databaseTeam) {
            if (databaseTeam.password !== password) {
                return NextResponse.json({ success: false, error: 'Invalid Participant ID or Password' }, { status: 401 });
            }
            return NextResponse.json({
                success: true,
                teamId: databaseTeam.team_id,
                teamName: databaseTeam.team_name
            });
        }
        if (databaseError && databaseError.code !== 'MISSING_CONFIG') {
            console.error('Database team authentication failed:', databaseError);
            return NextResponse.json({ success: false, error: 'Could not verify team credentials.' }, { status: 500 });
        }

        const team = getLocalTeams().find(candidate =>
            candidate.teamId?.toLowerCase() === teamId.trim().toLowerCase() && candidate.password === password
        );
        if (!team) {
            return NextResponse.json({ success: false, error: 'Invalid Participant ID or Password' }, { status: 401 });
        }

        return NextResponse.json({
            success: true,
            teamId: team.teamId,
            teamName: team.team
        });
    } catch (error) {
        console.error('Local team authentication failed:', error);
        return NextResponse.json({ success: false, error: 'Could not verify team credentials.' }, { status: 500 });
    }
}