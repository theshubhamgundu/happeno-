import { NextResponse } from 'next/server';
import { getLocalTeams } from '@/lib/local-team-store';

export async function POST(req: Request) {
    try {
        const { teamId, password } = await req.json();
        if (typeof teamId !== 'string' || typeof password !== 'string') {
            return NextResponse.json({ success: false, error: 'Team ID and password are required.' }, { status: 400 });
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