import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { MAX_TEAM_MEMBERS } from '@/lib/constants';
import { getSession, hasRole } from '@/lib/session';
import { hashPassword } from '@/lib/password';
import { randomBytes } from 'node:crypto';

function getMemberName(member: any): string {
    return typeof member === 'string' ? member : member?.fullName || member?.name || '';
}

export async function POST(req: Request) {
    if (!hasRole(getSession(req), ['admin'])) {
        return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });
    }

    try {
        const { sourceTeamIds, newTeamName } = await req.json();
        if (!Array.isArray(sourceTeamIds) || sourceTeamIds.length < 2) {
            return NextResponse.json({ error: 'At least two source teams are required.' }, { status: 400 });
        }
        if (new Set(sourceTeamIds).size !== sourceTeamIds.length) {
            return NextResponse.json({ error: 'Each source team must be selected only once.' }, { status: 400 });
        }
        if (typeof newTeamName !== 'string' || !newTeamName.trim()) {
            return NextResponse.json({ error: 'New team name is required.' }, { status: 400 });
        }

        const { data: sourceTeams, error: fetchError } = await supabase
            .from('registrations')
            .select('*')
            .in('team_id', sourceTeamIds.map(String))
            .neq('status', 'MERGED');
        if (fetchError) throw fetchError;
        if (!sourceTeams || sourceTeams.length !== sourceTeamIds.length) {
            return NextResponse.json({ error: 'One or more source teams could not be found.' }, { status: 404 });
        }

        const orderedSources = sourceTeamIds.map(id => sourceTeams.find(team => team.team_id === String(id))!);
        const members = orderedSources.flatMap(team => Array.isArray(team.members) ? team.members : []);
        if (!members.length) return NextResponse.json({ error: 'The selected teams have no participants.' }, { status: 400 });
        if (members.length > MAX_TEAM_MEMBERS) {
            return NextResponse.json({ error: `A team can have at most ${MAX_TEAM_MEMBERS} participants.` }, { status: 400 });
        }

        const entryType = members.length === 1 ? 'IND' : members.length === 2 ? 'DUO' : 'SQD';
        const { data: teamId, error: idError } = await supabase.rpc('next_registration_team_id');
        if (idError || typeof teamId !== 'string') throw idError || new Error('Could not reserve a team ID.');
        const password = randomBytes(18).toString('base64url');
        const captain = members[0];
        const captainDetails = captain && typeof captain === 'object' ? captain : {};
        const tracks = [...new Set(orderedSources.flatMap(team => {
            const preferences = Array.isArray(team.track_preferences) && team.track_preferences.length
                ? team.track_preferences
                : String(team.track || '').split(',');
            return preferences.map((track: string) => track.trim()).filter(Boolean);
        }))];

        const mergedTransactionId = randomUUID();
        const { data: mergedTeam, error: insertError } = await supabase
            .from('registrations')
            .insert({
            transaction_id: mergedTransactionId,
                team_id: teamId,
                team_name: newTeamName.trim(),
                password_hash: await hashPassword(password),
                track: tracks.join(', ') || 'General',
                track_preferences: tracks,
                entry_type: members.length === 1 ? 'INDIVIDUAL' : members.length === 2 ? 'DUO' : 'SQUAD',
                members,
                captain: getMemberName(captain),
                captain_mobile: captainDetails.phone || '',
                college: captainDetails.college || '',
                email: captainDetails.email || '',
                status: 'COMPLETED',
                raw_data: { merged_from: sourceTeamIds }
            })
            .select('team_id, team_name')
            .single();
        if (insertError) throw insertError;

        const { error: mergeError } = await supabase
            .from('registrations')
            .update({ status: 'MERGED' })
            .in('transaction_id', orderedSources.map(team => team.transaction_id));
        if (mergeError) {
            await supabase.from('registrations').delete().eq('transaction_id', mergedTransactionId);
            throw mergeError;
        }

        return NextResponse.json({
            success: true,
            newTeamId: mergedTeam.team_id,
            newTeamName: mergedTeam.team_name,
            newPassword: password,
            memberCount: members.length,
            mergedFrom: orderedSources.length,
            message: `Successfully merged ${orderedSources.length} registrations into "${mergedTeam.team_name}" (${mergedTeam.team_id}).`
        });
    } catch (error) {
        console.error('Supabase team merge failed:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not merge teams.' }, { status: 503 });
    }
}
