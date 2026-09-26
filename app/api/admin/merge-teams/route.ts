import { NextResponse } from 'next/server';
import { mergeLocalTeams } from '@/lib/local-team-store';

/**
 * Merge multiple registrations into one new team.
 *
 * POST body: { sourceTeamIds: string[], newTeamName: string, track?: string }
 *
 * Steps:
 *  1. Fetch all source registrations
 *  2. Combine members into one array
 *  3. Determine entry_type from combined count
 *  4. Generate new team_id and password
 *  5. Insert the merged registration
 *  6. Mark old registrations as MERGED
 */

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { sourceTeamIds, newTeamName } = body;

        if (!sourceTeamIds || !Array.isArray(sourceTeamIds) || sourceTeamIds.length < 2) {
            return NextResponse.json(
                { error: 'At least 2 source teams are required' },
                { status: 400 }
            );
        }

        if (!newTeamName || !newTeamName.trim()) {
            return NextResponse.json(
                { error: 'New team name is required' },
                { status: 400 }
            );
        }

        const { team, mergedFrom } = mergeLocalTeams(
            sourceTeamIds.map(String),
            newTeamName
        );

        return NextResponse.json({
            success: true,
            newTeamId: team.teamId,
            newTeamName: team.team,
            newPassword: team.password,
            memberCount: team.members.length,
            mergedFrom,
            message: `Successfully merged ${mergedFrom} registrations into "${team.team}" (${team.teamId})`
        });

    } catch (error: unknown) {
        console.error('❌ Merge teams error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : String(error) },
            { status: 400 }
        );
    }
}
