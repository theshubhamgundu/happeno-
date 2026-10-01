import { NextResponse } from 'next/server';
import { getSession, hasRole } from '@/lib/session';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET: Export data as CSV
export async function GET(req: Request) {
    const session = getSession(req);
    if (!hasRole(session, ['admin'])) {
        return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'teams', 'judges', 'volunteers', 'emails', 'dietary'

    if (!type || !['teams', 'judges', 'volunteers', 'emails', 'dietary'].includes(type)) {
        return NextResponse.json({ error: 'Valid export type is required: teams, judges, volunteers, emails, dietary' }, { status: 400 });
    }

    try {
        let csvContent = '';

        if (type === 'teams') {
            // Fetch all teams
            const teams: Record<string, unknown>[] = [];
            let from = 0;
            const pageSize = 1000;
            while (true) {
                const { data, error } = await supabase
                    .from('registrations')
                    .select('*')
                    .range(from, from + pageSize - 1);
                if (error) throw error;
                if (data) teams.push(...data);
                if (!data || data.length < pageSize) break;
                from += pageSize;
            }

            csvContent = 'Team ID,Team Name,Track,Captain,Captain Email,Captain Phone,College,Members Count,Check-In Status,Problem Statement\n';
            for (const team of teams) {
                const raw = team.raw_data as Record<string, unknown> || {};
                const members = (raw.members as unknown[]) || [];
                const captain = (members[0] as Record<string, string>) || {};
                csvContent += `"${team.team_id || ''}","${(raw.teamName as string || '').replace(/"/g, '""')}","${team.track || ''}","${captain.fullName || ''}","${captain.email || ''}","${captain.phone || ''}","${(raw.college as string || '').replace(/"/g, '""')}",${members.length},"${team.is_checked_in ? 'Yes' : 'No'}","${((team.problem_statement as string) || '').replace(/"/g, '""')}"\n`;
            }
        } else if (type === 'judges') {
            const { data, error } = await supabase
                .from('judges')
                .select('generated_id, name, specialization');
            if (error) throw error;

            csvContent = 'Judge ID,Name,Specialization\n';
            for (const judge of data || []) {
                csvContent += `"${judge.generated_id}","${judge.name}","${judge.specialization}"\n`;
            }
        } else if (type === 'volunteers') {
            const { data, error } = await supabase
                .from('volunteers')
                .select('generated_id, name, phone, role');
            if (error) throw error;

            csvContent = 'Volunteer ID,Name,Phone,Role\n';
            for (const vol of data || []) {
                csvContent += `"${vol.generated_id}","${vol.name}","${vol.phone}","${vol.role}"\n`;
            }
        } else if (type === 'emails') {
            // Export all participant emails for mail merges
            const teams: Record<string, unknown>[] = [];
            let from = 0;
            const pageSize = 1000;
            while (true) {
                const { data, error } = await supabase
                    .from('registrations')
                    .select('team_id, raw_data')
                    .range(from, from + pageSize - 1);
                if (error) throw error;
                if (data) teams.push(...data);
                if (!data || data.length < pageSize) break;
                from += pageSize;
            }

            csvContent = 'Email,Full Name,Team ID,Team Name,Role\n';
            for (const team of teams) {
                const raw = team.raw_data as Record<string, unknown> || {};
                const members = (raw.members as Record<string, string>[]) || [];
                const teamName = (raw.teamName as string) || 'Unknown';
                members.forEach((member, index) => {
                    if (member.email) {
                        csvContent += `"${member.email}","${(member.fullName || '').replace(/"/g, '""')}","${team.team_id}","${teamName.replace(/"/g, '""')}","${index === 0 ? 'Captain' : 'Member'}"\n`;
                    }
                });
            }
        } else if (type === 'dietary') {
            // Export dietary restrictions / special requirements
            const teams: Record<string, unknown>[] = [];
            let from = 0;
            const pageSize = 1000;
            while (true) {
                const { data, error } = await supabase
                    .from('registrations')
                    .select('team_id, raw_data, meal_state')
                    .range(from, from + pageSize - 1);
                if (error) throw error;
                if (data) teams.push(...data);
                if (!data || data.length < pageSize) break;
                from += pageSize;
            }

            csvContent = 'Team ID,Team Name,Member Name,Dietary Notes\n';
            for (const team of teams) {
                const raw = team.raw_data as Record<string, unknown> || {};
                const members = (raw.members as Record<string, string>[]) || [];
                const teamName = (raw.teamName as string) || 'Unknown';
                members.forEach((member) => {
                    if (member.dietary) {
                        csvContent += `"${team.team_id}","${teamName.replace(/"/g, '""')}","${(member.fullName || '').replace(/"/g, '""')}","${member.dietary.replace(/"/g, '""')}"\n`;
                    }
                });
            }
        }

        const filename = `tricity_${type}_export_${new Date().toISOString().split('T')[0]}.csv`;

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Cache-Control': 'no-store'
            }
        });
    } catch (error) {
        console.error('CSV export failed:', error);
        return NextResponse.json({ error: 'Could not generate export.' }, { status: 503 });
    }
}
