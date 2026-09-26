import fs from 'node:fs';
import path from 'node:path';
import Papa from 'papaparse';
import type { Member, Project } from '@/context/HackathonContext';
import { MAX_TEAM_MEMBERS } from '@/lib/constants';

interface LocalMergeState {
    mergedTeams: Project[];
    mergedSourceIds: string[];
    updatedTeams: Project[];
}

interface CsvRegistration {
    teamId: string;
    teamName: string;
    track: string;
    participants: { member: Member; isLeader: boolean }[];
}

export interface LocalMemberTransfer {
    sourceTeamId: string;
    memberIndex: number;
}

function generateCsvPassword(members: Member[], teamId: string): string {
    const initials = members
        .map(member => member.fullName.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase())
        .filter(Boolean)
        .join('-');
    const idParts = teamId.match(/^TRI(\d{2})(\d{3})$/);
    const teamNumber = idParts
        ? `${idParts[1]}${Number(idParts[2]).toString().padStart(2, '0')}`
        : teamId.match(/(\d+)$/)?.[1] || teamId;
    return `${initials}@TRI-${teamNumber}`;
}

const mergeStatePath = () => path.join(process.cwd(), 'data', 'local-team-merges.json');

function readMergeState(): LocalMergeState {
    const filePath = mergeStatePath();
    if (!fs.existsSync(filePath)) return { mergedTeams: [], mergedSourceIds: [], updatedTeams: [] };

    const state = JSON.parse(fs.readFileSync(filePath, 'utf8')) as LocalMergeState;
    return {
        mergedTeams: Array.isArray(state.mergedTeams) ? state.mergedTeams : [],
        mergedSourceIds: Array.isArray(state.mergedSourceIds) ? state.mergedSourceIds : [],
        updatedTeams: Array.isArray(state.updatedTeams) ? state.updatedTeams : []
    };
}

function saveTeamOverride(state: LocalMergeState, team: Project): void {
    const teamId = String(team.teamId || team.id);
    const mergedIndex = state.mergedTeams.findIndex(candidate => String(candidate.teamId || candidate.id) === teamId);
    if (mergedIndex >= 0) {
        state.mergedTeams[mergedIndex] = team;
        return;
    }

    const updatedIndex = state.updatedTeams.findIndex(candidate => String(candidate.teamId || candidate.id) === teamId);
    if (updatedIndex >= 0) state.updatedTeams[updatedIndex] = team;
    else state.updatedTeams.push(team);
}

function teamWithMembers(team: Project, members: Project['members'], memberMealState: Project['memberMealState']): Project {
    const firstMember = members[0];
    const captainDetails: Partial<Member> = typeof firstMember === 'string' || !firstMember ? {} : firstMember;
    return {
        ...team,
        members,
        memberMealState,
        captain: memberName(firstMember || team.captain),
        captainMobile: captainDetails.phone || '',
        college: captainDetails.college || ''
    };
}

function readCsvTeams(): Project[] | null {
    const csvPath = path.join(process.cwd(), 'Book1_updated (1).csv');
    if (!fs.existsSync(csvPath)) return null;

    const csv = fs.readFileSync(csvPath, 'utf8');
    const { data: rows } = Papa.parse<Record<string, string>>(csv, {
        header: true,
        skipEmptyLines: true
    });
    const registrations = new Map<string, CsvRegistration>();

    for (const row of rows) {
        const teamId = row['Registration ID']?.trim();
        if (!teamId) continue;

        const member: Member = {
            fullName: row['Name']?.trim() || '',
            email: row['Email']?.trim() || '',
            phone: row['Phone Number']?.trim() || '',
            college: row['College']?.trim() || '',
            year: row['Year']?.trim() || '',
            department: row['Department']?.trim() || ''
        };
        if (!member.fullName && !member.email) continue;

        const registration = registrations.get(teamId) || {
            teamId,
            teamName: row['Team Name']?.trim() || '',
            track: row['Selected Tracks']?.trim() || 'General',
            participants: []
        };
        registration.participants.push({
            member,
            isLeader: row['Role']?.trim().toLowerCase() === 'team leader'
        });
        registrations.set(teamId, registration);
    }

    return Array.from(registrations.values()).map(registration => {
        registration.participants.sort((a, b) => Number(b.isLeader) - Number(a.isLeader));
        const members = registration.participants.map(entry => entry.member);
        const captain = members[0];
        const team = registration.teamName.toLowerCase() === 'individual'
            ? captain?.fullName || registration.teamName
            : registration.teamName || captain?.fullName || 'Unknown Team';

        return {
            id: registration.teamId,
            teamId: registration.teamId,
            name: team,
            team,
            track: registration.track,
            trackPreferences: registration.track.split(',').map(track => track.trim()).filter(Boolean),
            problemStatement: '',
            members,
            captain: captain?.fullName || 'N/A',
            captainMobile: captain?.phone || '',
            college: captain?.college || '',
            status: 'REGISTERED',
            password: generateCsvPassword(members, registration.teamId),
            roundScores: {}
        };
    });
}

function readJsonTeams(): Project[] {
    const jsonPath = path.join(process.cwd(), 'data', 'registrations.json');
    if (!fs.existsSync(jsonPath)) return [];

    const registrations = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as {
        teamId?: string;
        teamName?: string;
        track?: string;
        password?: string;
        participants?: (string | Member)[];
        problemStatement?: string;
    }[];

    return registrations.map((registration, index) => {
        const members = registration.participants || [];
        const captain = members[0];
        const captainName = typeof captain === 'string' ? captain : captain?.fullName || 'N/A';
        const teamId = registration.teamId || `TRI-${String(index + 1).padStart(3, '0')}`;
        const team = registration.teamName || 'Unknown Team';

        return {
            id: teamId,
            teamId,
            name: team,
            team,
            track: registration.track || '',
            problemStatement: registration.problemStatement || '',
            members,
            captain: captainName,
            captainMobile: typeof captain === 'string' ? '' : captain?.phone || '',
            college: typeof captain === 'string' ? '' : captain?.college || '',
            status: 'REGISTERED',
            password: registration.password || '',
            roundScores: {}
        };
    });
}

export function getLocalTeams(): Project[] {
    const state = readMergeState();
    const mergedSourceIds = new Set(state.mergedSourceIds);
    const updatedTeams = new Map(state.updatedTeams.map(team => [String(team.teamId || team.id), team]));
    const baseTeams = (readCsvTeams() ?? readJsonTeams()).map(team =>
        updatedTeams.has(String(team.teamId || team.id))
            ? { ...team, ...updatedTeams.get(String(team.teamId || team.id)) }
            : team
    );

    return [
        ...baseTeams.filter(team => !mergedSourceIds.has(String(team.teamId || team.id))),
        ...state.mergedTeams.filter(team => !mergedSourceIds.has(String(team.teamId || team.id)))
    ];
}

export function updateLocalTeam(
    teamId: string,
    password: string,
    changes: Partial<Pick<Project, 'team' | 'track' | 'captain' | 'captainMobile' | 'college' | 'members'>>
): Project | null {
    const team = getLocalTeams().find(candidate =>
        String(candidate.teamId || candidate.id).toLowerCase() === teamId.toLowerCase() && candidate.password === password
    );
    if (!team) return null;

    return updateLocalTeamById(teamId, changes);
}

export function updateLocalTeamById(teamId: string, changes: Partial<Project>): Project | null {
    const team = getLocalTeams().find(candidate =>
        String(candidate.teamId || candidate.id).toLowerCase() === teamId.toLowerCase()
    );
    if (!team) return null;

    const updatedMembers = changes.members ?? team.members;
    const firstMember = updatedMembers[0];
    const captain = firstMember ? memberName(firstMember) : changes.captain || team.captain;
    const captainDetails: Partial<Member> = typeof firstMember === 'string' || !firstMember ? {} : firstMember;
    const teamName = changes.team ?? changes.name ?? team.team;
    const updatedTeam: Project = {
        ...team,
        ...changes,
        name: teamName,
        team: teamName,
        members: updatedMembers,
        captain: changes.captain ?? captain,
        captainMobile: changes.captainMobile ?? captainDetails.phone ?? team.captainMobile,
        college: changes.college ?? captainDetails.college ?? team.college
    };

    const state = readMergeState();
    saveTeamOverride(state, updatedTeam);

    fs.mkdirSync(path.dirname(mergeStatePath()), { recursive: true });
    fs.writeFileSync(mergeStatePath(), JSON.stringify(state, null, 2), 'utf8');
    return updatedTeam;
}

export function transferLocalTeamMembers(targetTeamId: string, selections: LocalMemberTransfer[]) {
    if (!selections.length) throw new Error('Select at least one existing participant.');

    const teams = getLocalTeams();
    const targetTeam = teams.find(team => String(team.teamId || team.id) === targetTeamId);
    if (!targetTeam) throw new Error('The destination team could not be found. Refresh and try again.');
    if (targetTeam.members.length + selections.length > MAX_TEAM_MEMBERS) {
        throw new Error(`A team can have at most ${MAX_TEAM_MEMBERS} participants.`);
    }

    const selectedKeys = new Set<string>();
    const selectedByTeam = new Map<string, Set<number>>();
    const movedMembers: Project['members'] = [];
    const targetMealState = { ...targetTeam.memberMealState };

    for (const selection of selections) {
        if (selection.sourceTeamId === targetTeamId) throw new Error('Choose participants from other teams.');
        const selectionKey = `${selection.sourceTeamId}:${selection.memberIndex}`;
        if (selectedKeys.has(selectionKey)) throw new Error('A participant can only be selected once.');
        selectedKeys.add(selectionKey);

        const sourceTeam = teams.find(team => String(team.teamId || team.id) === selection.sourceTeamId);
        const member = sourceTeam?.members[selection.memberIndex];
        if (!sourceTeam || !member) throw new Error('A selected participant could not be found. Refresh and try again.');

        const indexes = selectedByTeam.get(selection.sourceTeamId) || new Set<number>();
        indexes.add(selection.memberIndex);
        selectedByTeam.set(selection.sourceTeamId, indexes);
        movedMembers.push(member);

        const email = typeof member === 'string' ? '' : member.email || '';
        if (email && sourceTeam.memberMealState?.[email]) {
            targetMealState[email] = sourceTeam.memberMealState[email];
        }
    }

    const state = readMergeState();
    const updatedTarget = teamWithMembers(targetTeam, [...targetTeam.members, ...movedMembers], targetMealState);
    saveTeamOverride(state, updatedTarget);

    const updatedSourceTeams: Project[] = [];
    const removedTeamIds: string[] = [];
    for (const [sourceTeamId, indexes] of selectedByTeam) {
        const sourceTeam = teams.find(team => String(team.teamId || team.id) === sourceTeamId);
        if (!sourceTeam) continue;

        const remainingMembers = sourceTeam.members.filter((_, index) => !indexes.has(index));
        const memberMealState = { ...sourceTeam.memberMealState };
        for (const memberIndex of indexes) {
            const member = sourceTeam.members[memberIndex];
            const email = typeof member === 'string' ? '' : member.email || '';
            if (email && !remainingMembers.some(remaining => typeof remaining !== 'string' && remaining.email === email)) {
                delete memberMealState[email];
            }
        }

        if (!remainingMembers.length) {
            removedTeamIds.push(sourceTeamId);
            continue;
        }

        const updatedSource = teamWithMembers(sourceTeam, remainingMembers, memberMealState);
        saveTeamOverride(state, updatedSource);
        updatedSourceTeams.push(updatedSource);
    }

    if (removedTeamIds.length) {
        state.mergedSourceIds = Array.from(new Set([...state.mergedSourceIds, ...removedTeamIds]));
        state.mergedTeams = state.mergedTeams.filter(team => !removedTeamIds.includes(String(team.teamId || team.id)));
        state.updatedTeams = state.updatedTeams.filter(team => !removedTeamIds.includes(String(team.teamId || team.id)));
    }

    fs.mkdirSync(path.dirname(mergeStatePath()), { recursive: true });
    fs.writeFileSync(mergeStatePath(), JSON.stringify(state, null, 2), 'utf8');

    return { targetTeam: updatedTarget, updatedSourceTeams, removedTeamIds };
}

function memberName(member: string | Member): string {
    return typeof member === 'string' ? member : member.fullName || '';
}

export function mergeLocalTeams(sourceIds: string[], newTeamName: string) {
    const requestedIds = new Set(sourceIds);
    if (requestedIds.size < 2) throw new Error('Select at least two different teams to merge.');

    const activeTeams = getLocalTeams();
    const sourceTeams = Array.from(requestedIds, id => activeTeams.find(team =>
        String(team.id) === id || String(team.teamId || '') === id
    )).filter((team): team is Project => Boolean(team));
    if (sourceTeams.length !== requestedIds.size) {
        throw new Error('One or more selected teams could not be found. Refresh the page and try again.');
    }

    const captainTeam = sourceTeams.find(team => (team.members?.length || 0) > 1) || sourceTeams[0];
    const members = [
        ...(captainTeam.members || []),
        ...sourceTeams.filter(team => team !== captainTeam).flatMap(team => team.members || [])
    ];
    if (members.length === 0) throw new Error('The selected teams have no members to merge.');
    if (members.length > MAX_TEAM_MEMBERS) {
        throw new Error(`A team can have at most ${MAX_TEAM_MEMBERS} participants. The selected teams have ${members.length}.`);
    }

    const tracks = Array.from(new Set(sourceTeams.flatMap(team =>
        (team.trackPreferences?.length ? team.trackPreferences : team.track.split(','))
            .map(track => track.trim())
            .filter(Boolean)
    )));

    const entryType = members.length === 1 ? 'IND' : members.length === 2 ? 'DUO' : 'SQD';
    const state = readMergeState();
    const knownTeams = [...(readCsvTeams() ?? readJsonTeams()), ...state.mergedTeams];
    const maxTeamNumber = knownTeams.reduce((max, team) => {
        const match = String(team.teamId || '').match(/(\d+)$/);
        return match ? Math.max(max, Number(match[1])) : max;
    }, 100);
    const teamNumber = maxTeamNumber + 1;
    const teamId = `HB-${entryType}-${teamNumber}`;
    const password = `${members.map(member => memberName(member).replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase()).filter(Boolean).join('-')}@HB-${entryType}-${teamNumber}`;
    const captain = members[0];
    const captainName = memberName(captain);
    const captainDetails: Partial<Member> = typeof captain === 'string' ? {} : captain;
    const mergedTeam: Project = {
        id: teamId,
        teamId,
        name: newTeamName.trim(),
        team: newTeamName.trim(),
        track: tracks.join(', ') || 'General',
        problemStatement: '',
        members,
        captain: captainName,
        captainMobile: captainDetails.phone || '',
        college: captainDetails.college || '',
        status: 'COMPLETED',
        password,
        roundScores: {},
        trackPreferences: tracks,
        techStack: {},
        isPSLocked: false,
        isPILocked: false,
        isTSLocked: false,
        isCheckedIn: false,
        checkedInAt: null,
        memberMealState: {},
        room: '',
        roomWifiSSID: '',
        roomWifiPass: '',
        coordinator: { name: '', phone: '' },
        submission: { github: '', presentation: '', demo: '', deployment: '', isFinal: false }
    };

    const sourceTeamIds = sourceTeams.map(team => String(team.teamId || team.id));
    const mergedSourceIds = new Set([...state.mergedSourceIds, ...sourceTeamIds]);
    const nextState: LocalMergeState = {
        mergedTeams: [
            ...state.mergedTeams.filter(team => !sourceTeamIds.includes(String(team.teamId || team.id))),
            mergedTeam
        ],
        mergedSourceIds: Array.from(mergedSourceIds),
        updatedTeams: state.updatedTeams
    };

    fs.mkdirSync(path.dirname(mergeStatePath()), { recursive: true });
    fs.writeFileSync(mergeStatePath(), JSON.stringify(nextState, null, 2), 'utf8');

    return { team: mergedTeam, mergedFrom: sourceTeams.length };
}