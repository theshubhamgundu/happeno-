import { createClient } from '@supabase/supabase-js';
import nextEnv from '@next/env';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import Papa from 'papaparse';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const { loadEnvConfig } = nextEnv;
loadEnvConfig(root);
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dryRun = process.argv.includes('--dry-run');

if (!dryRun && (!supabaseUrl || !serviceRoleKey)) {
    throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running the data migration.');
}

const supabase = supabaseUrl && serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
}) : null;

function readJson(relativePath, fallback) {
    const filePath = path.join(root, relativePath);
    return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : fallback;
}

function memberName(member) {
    return typeof member === 'string' ? member : member?.fullName || member?.name || '';
}

function passwordForMembers(members, teamId) {
    const initials = members
        .map(member => memberName(member).replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase())
        .filter(Boolean)
        .join('-');
    const idParts = teamId.match(/^TRI(\d{2})(\d{3})$/);
    const teamNumber = idParts
        ? `${idParts[1]}${Number(idParts[2]).toString().padStart(2, '0')}`
        : teamId.match(/(\d+)$/)?.[1] || teamId;
    return `${initials}@TRI-${teamNumber}`;
}

function fromCsv() {
    const filePath = path.join(root, 'Book1_updated (1).csv');
    if (!fs.existsSync(filePath)) return null;

    const { data: rows } = Papa.parse(fs.readFileSync(filePath, 'utf8'), {
        header: true,
        skipEmptyLines: true
    });
    const grouped = new Map();

    for (const row of rows) {
        const teamId = row['Registration ID']?.trim();
        if (!teamId) continue;

        const member = {
            fullName: row['Name']?.trim() || '',
            email: row['Email']?.trim() || '',
            phone: row['Phone Number']?.trim() || '',
            college: row['College']?.trim() || '',
            year: row['Year']?.trim() || '',
            department: row['Department']?.trim() || ''
        };
        if (!member.fullName && !member.email) continue;

        const team = grouped.get(teamId) || {
            id: teamId,
            teamId,
            team: row['Team Name']?.trim() || '',
            track: row['Selected Tracks']?.trim() || 'General',
            participants: []
        };
        team.participants.push({ member, isLeader: row['Role']?.trim().toLowerCase() === 'team leader' });
        grouped.set(teamId, team);
    }

    return [...grouped.values()].map(team => {
        team.participants.sort((left, right) => Number(right.isLeader) - Number(left.isLeader));
        const members = team.participants.map(({ member }) => member);
        const captain = members[0];
        const name = team.team.toLowerCase() === 'individual'
            ? captain?.fullName || team.team
            : team.team || captain?.fullName || 'Unknown Team';
        const trackPreferences = team.track.split(',').map(value => value.trim()).filter(Boolean);

        return {
            ...team,
            name,
            team: name,
            members,
            captain: captain?.fullName || 'N/A',
            captainMobile: captain?.phone || '',
            college: captain?.college || '',
            password: passwordForMembers(members, team.teamId),
            trackPreferences,
            status: 'REGISTERED'
        };
    });
}

function fromJson() {
    const registrations = readJson('data/registrations.json', []);
    return registrations.map((registration, index) => {
        const members = registration.participants || registration.members || [];
        const teamId = registration.teamId || `TRI-${String(index + 1).padStart(3, '0')}`;
        const captain = members[0];
        const name = registration.teamName || 'Unknown Team';
        return {
            ...registration,
            id: teamId,
            teamId,
            name,
            team: name,
            members,
            captain: registration.captain || memberName(captain) || 'N/A',
            captainMobile: registration.captainMobile || captain?.phone || '',
            college: registration.college || captain?.college || '',
            status: registration.status || 'REGISTERED'
        };
    });
}

async function toRegistrationRow(team, existingRegistration) {
    const members = team.members || team.participants || [];
    const captain = members[0];
    const captainObject = typeof captain === 'string' ? {} : captain || {};
    const trackPreferences = team.trackPreferences || team.track_preferences || [];
    const submission = team.submission || {};

    return {
        transaction_id: team.transactionId || team.transaction_id || existingRegistration?.transaction_id || randomUUID(),
        team_id: String(team.teamId || team.team_id || team.id),
        team_name: team.team || team.name || team.teamName || 'Unknown Team',
        password_hash: existingRegistration?.password_hash || (team.password ? await bcrypt.hash(team.password, 12) : null),
        track: team.track || '',
        problem_statement: team.problemStatement || team.problem_statement || '',
        proposed_idea: team.proposedIdea || team.proposed_idea || '',
        tech_stack: team.techStack || team.tech_stack || {},
        track_preferences: trackPreferences,
        college: team.college || captainObject.college || '',
        captain: team.captain || memberName(captain) || '',
        captain_mobile: team.captainMobile || team.captain_mobile || captainObject.phone || '',
        email: team.email || captainObject.email || '',
        entry_type: team.entryType || team.entry_type || null,
        members,
        status: team.status || 'REGISTERED',
        github_url: submission.github || team.github_url || '',
        presentation_url: submission.presentation || team.presentation_url || '',
        demo_url: submission.demo || team.demo_url || '',
        deployment_url: submission.deployment || team.deployment_url || '',
        is_final_submission: submission.isFinal ?? team.is_final_submission ?? false,
        round_scores: team.roundScores || team.round_scores || {},
        round_comments: team.roundComments || team.round_comments || {},
        round_detailed_scores: team.roundDetailedScores || team.round_detailed_scores || {},
        is_checked_in: team.isCheckedIn ?? team.is_checked_in ?? false,
        member_meal_state: team.memberMealState || team.member_meal_state || {},
        meal_access: team.mealAccess || team.meal_access || {},
        room: team.room || '',
        volunteer_name: team.volunteerName || team.volunteer_name || '',
        volunteer_phone: team.volunteerPhone || team.volunteer_phone || '',
        room_wifi_ssid: team.roomWifiSSID || team.room_wifi_ssid || '',
        room_wifi_pass: team.roomWifiPass || team.room_wifi_pass || '',
        assigned_judge: team.assignedJudge || team.assigned_judge || '',
        raw_data: team.raw_data || team.rawData || {},
        created_at: team.createdAt || team.created_at || existingRegistration?.created_at || new Date().toISOString(),
        completed_at: team.completedAt || team.completed_at || null
    };
}

async function upsertInBatches(table, rows, onConflict) {
    if (!supabase) throw new Error('Supabase client is not available.');
    for (let offset = 0; offset < rows.length; offset += 500) {
        const { error } = await supabase.from(table).upsert(rows.slice(offset, offset + 500), { onConflict });
        if (error) throw new Error(`Failed importing ${table}: ${error.message}`);
    }
}

async function main() {
    const csvTeams = fromCsv() || [];
    const jsonTeams = fromJson();
    const teamsById = new Map(csvTeams.map(team => [String(team.teamId || team.id), team]));
    const preservedFields = [
        'password', 'status', 'problemStatement', 'proposedIdea', 'techStack', 'isPSLocked',
        'isPILocked', 'isTSLocked', 'roundScores', 'roundComments', 'roundDetailedScores',
        'submission', 'isCheckedIn', 'checkedInAt', 'memberMealState', 'mealAccess', 'room',
        'roomWifiSSID', 'roomWifiPass', 'coordinator', 'createdAt', 'completedAt'
    ];
    for (const jsonTeam of jsonTeams) {
        const id = String(jsonTeam.teamId || jsonTeam.id);
        const csvTeam = teamsById.get(id);
        if (!csvTeam) {
            teamsById.set(id, jsonTeam);
            continue;
        }
        const merged = { ...jsonTeam, ...csvTeam };
        for (const field of preservedFields) {
            if (jsonTeam[field] !== undefined) merged[field] = jsonTeam[field];
        }
        if (csvTeam.members?.length) merged.members = csvTeam.members;
        teamsById.set(id, merged);
    }
    const teams = [...teamsById.values()];
    const mergeState = readJson('data/local-team-merges.json', null);
    let finalTeams = teams;

    if (mergeState) {
        const mergedSourceIds = new Set(mergeState.mergedSourceIds || []);
        const overrides = new Map([...(mergeState.updatedTeams || []), ...(mergeState.mergedTeams || [])]
            .map(team => [String(team.teamId || team.id), team]));
        finalTeams = teams
            .filter(team => !mergedSourceIds.has(String(team.teamId || team.id)))
            .map(team => ({ ...team, ...overrides.get(String(team.teamId || team.id)) }));
        const existingIds = new Set(finalTeams.map(team => String(team.teamId || team.id)));
        for (const team of mergeState.mergedTeams || []) {
            const id = String(team.teamId || team.id);
            if (!mergedSourceIds.has(id) && !existingIds.has(id)) finalTeams.push(team);
        }
    }

    if (dryRun) {
        console.log(JSON.stringify({
            registrations: finalTeams.length,
            settings: Object.keys(readJson('data/settings.json', {})).length,
            judges: readJson('data/judges.json', []).length,
            volunteers: readJson('data/volunteers.json', []).length
        }, null, 2));
        return;
    }

    if (!supabase) throw new Error('Supabase client is not available.');
    const existingRegistrations = new Map();
    const teamIds = finalTeams.map(team => String(team.teamId || team.team_id || team.id));
    for (let offset = 0; offset < teamIds.length; offset += 500) {
        const { data, error } = await supabase
            .from('registrations')
            .select('team_id, transaction_id, password_hash, created_at')
            .in('team_id', teamIds.slice(offset, offset + 500));
        if (error) throw new Error(`Failed checking existing registrations: ${error.message}`);
        for (const row of data || []) existingRegistrations.set(row.team_id, row);
    }

    const registrationRows = await Promise.all(finalTeams.map(team =>
        toRegistrationRow(team, existingRegistrations.get(String(team.teamId || team.team_id || team.id)))
    ));
    await upsertInBatches('registrations', registrationRows, 'team_id');

    const settings = readJson('data/settings.json', {});
    const settingRows = Object.entries(settings).map(([key, value]) => ({ key, value }));
    await upsertInBatches('hackathon_settings', settingRows, 'key');

    for (const [file, table] of [['data/judges.json', 'judges'], ['data/volunteers.json', 'volunteers']]) {
        const records = readJson(file, []);
        const rows = (await Promise.all(records.map(async record => ({
            name: record.name,
            generated_id: record.generated_id || record.generatedId || record.id,
            password_hash: record.password ? await bcrypt.hash(record.password, 12) : null,
            specialization: record.specialization || null,
            phone: record.phone || null,
            role: record.role || null,
            created_at: record.created_at || new Date().toISOString()
        })))).filter(record => record.name && record.generated_id && record.password_hash);
        await upsertInBatches(table, rows, 'generated_id');
    }

    console.log(`Imported ${registrationRows.length} registrations, ${settingRows.length} settings, and staff records into Supabase.`);
}

main().catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
