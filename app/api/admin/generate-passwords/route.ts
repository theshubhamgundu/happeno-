import { NextResponse } from 'next/server';
import { teamSupabase as supabase } from '@/lib/supabase';

/**
 * Password formula: first 2 UPPERCASE letters of each member's name joined with "-"
 * then @VH26-[TEAM_NUMBER]
 * Example: members ["Rahul Verma", "Ankit Kumar", "Priya Nair"], team 101
 *          â†’ RA-AN-PR@VH26-101
 */
function generatePasswordFromMembers(members: any[], teamNum: number, entryType: string): string {
    const initials = members
        .map((m: any) => {
            const name: string = typeof m === 'string' ? m : (m.fullName || m.name || '');
            return name.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase();
        })
        .filter(Boolean)
        .join('-');

    let prefix = 'HB';
    if (entryType === 'INDIVIDUAL') prefix += '-IND';
    else if (entryType === 'DUO') prefix += '-DUO';
    else if (entryType === 'SQUAD') prefix += '-SQD';
    else prefix += '-TEAM';

    return `${initials}@${prefix}-${teamNum}`;
}

export async function POST() {
    try {
        // Fetch all registrations including members and entry_type
        const { data: teams, error: fetchError } = await supabase
            .from('registrations')
            .select('transaction_id, team_id, team_name, members, entry_type');

        if (fetchError) {
            return NextResponse.json({ error: 'Failed to fetch teams', details: fetchError.message }, { status: 500 });
        }

        if (!teams || teams.length === 0) {
            return NextResponse.json({ success: true, updated: 0, message: 'No teams found' });
        }

        let updatedCount = 0;
        const errors: string[] = [];

        // Simple counter for new team IDs
        let teamCounter = 101;
        // Pre-find the highest existing team ID number to avoid collisions
        teams.forEach((t: any) => {
            if (t.team_id) {
                const parts = t.team_id.split('-');
                const num = parseInt(parts[parts.length - 1]);
                if (!isNaN(num) && num >= teamCounter) teamCounter = num + 1;
            }
        });

        for (const team of teams) {
            const members = Array.isArray(team.members) ? team.members : [];
            const entryType = team.entry_type || 'INDIVIDUAL';
            
            let teamId = team.team_id;
            let teamNum = 0;

            if (teamId) {
                const parts = teamId.split('-');
                teamNum = parseInt(parts[parts.length - 1]);
            } else {
                teamNum = teamCounter++;
                let prefix = 'HB';
                if (entryType === 'INDIVIDUAL') prefix += '-IND';
                else if (entryType === 'DUO') prefix += '-DUO';
                else if (entryType === 'SQUAD') prefix += '-SQD';
                else prefix += '-TEAM';
                teamId = `${prefix}-${teamNum}`;
            }

            if (isNaN(teamNum)) teamNum = teamCounter++;

            const password = generatePasswordFromMembers(members, teamNum, entryType);

            const { error: updateError } = await supabase
                .from('registrations')
                .update({ password, team_id: teamId })
                .eq('transaction_id', team.transaction_id);

            if (updateError) {
                errors.push(`Failed for ${team.transaction_id}: ${updateError.message}`);
            } else {
                updatedCount++;
            }
        }

        return NextResponse.json({
            success: true,
            updated: updatedCount,
            errors: errors.length > 0 ? errors : undefined,
            message: `Successfully set passwords for ${updatedCount} teams.`
        });

    } catch (error: any) {
        console.error('âŒ Generate passwords error:', error);
        return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
    }
}
