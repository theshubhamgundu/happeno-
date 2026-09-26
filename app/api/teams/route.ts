import { NextResponse } from 'next/server';
import { teamSupabase as supabase } from '@/lib/supabase';
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';
import { getDefaultMealAccess } from '@/lib/meals';
import { getLocalTeams, transferLocalTeamMembers, updateLocalTeamById } from '@/lib/local-team-store';
import { MAX_TEAM_MEMBERS } from '@/lib/constants';

// Disable edge caching so data is always fresh
export const revalidate = 0;

export async function GET(req: Request) {
    if (process.env.USE_SUPABASE_REGISTRATIONS === 'true') {
        return getSupabaseTeams(req);
    }

    try {
        const { searchParams } = new URL(req.url);
        const teamId = searchParams.get('teamId');
        let teams = getLocalTeams();
        if (teamId) {
            teams = teams.filter(team => String(team.teamId || '').toLowerCase().includes(teamId.toLowerCase()));
        }
        return NextResponse.json(teams);
    } catch (error) {
        console.error('Failed to load local teams:', error);
        return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
    }
}

async function getSupabaseTeams(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const teamId = searchParams.get('teamId');

        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            const mergeStatePath = path.join(process.cwd(), 'data', 'local-team-merges.json');
            if (fs.existsSync(mergeStatePath)) {
                let teams = getLocalTeams();
                if (teamId) {
                    teams = teams.filter(team => String(team.teamId || '').toLowerCase().includes(teamId.toLowerCase()));
                }
                return NextResponse.json(teams);
            }

            const csvPath = path.join(process.cwd(), 'Book1_updated (1).csv');
            if (fs.existsSync(csvPath)) {
                const csv = fs.readFileSync(csvPath, 'utf8');
                const { data: rows } = Papa.parse<Record<string, string>>(csv, {
                    header: true,
                    skipEmptyLines: true
                });
                const registrations = new Map<string, {
                    teamId: string;
                    teamName: string;
                    track: string;
                    members: { fullName: string; email: string; phone: string; college: string; year: string; department: string; isLeader: boolean }[];
                }>();

                for (const row of rows) {
                    const id = row['Registration ID']?.trim();
                    if (!id) continue;

                    const member = {
                        fullName: row['Name']?.trim() || '',
                        email: row['Email']?.trim() || '',
                        phone: row['Phone Number']?.trim() || '',
                        college: row['College']?.trim() || '',
                        year: row['Year']?.trim() || '',
                        department: row['Department']?.trim() || '',
                        isLeader: row['Role']?.trim().toLowerCase() === 'team leader'
                    };
                    if (!member.fullName && !member.email) continue;

                    const registration = registrations.get(id) || {
                        teamId: id,
                        teamName: row['Team Name']?.trim() || '',
                        track: row['Selected Tracks']?.trim() || 'General',
                        members: []
                    };
                    registration.members.push(member);
                    registrations.set(id, registration);
                }

                let teams = Array.from(registrations.values()).map(registration => {
                    registration.members.sort((a, b) => Number(b.isLeader) - Number(a.isLeader));
                    const members = registration.members.map(({ isLeader, ...member }) => member);
                    const captain = members[0];
                    const teamName = registration.teamName.toLowerCase() === 'individual'
                        ? captain?.fullName || registration.teamName
                        : registration.teamName || captain?.fullName || 'Unknown Team';

                    return {
                        id: registration.teamId,
                        name: teamName,
                        team: teamName,
                        track: registration.track,
                        captain: captain?.fullName || 'N/A',
                        captainMobile: captain?.phone || '',
                        college: captain?.college || '',
                        teamId: registration.teamId,
                        password: '',
                        members,
                        status: 'REGISTERED',
                        problemStatement: '',
                        proposedIdea: '',
                        techStack: {},
                        isPSLocked: false,
                        isPILocked: false,
                        isTSLocked: false,
                        trackPreferences: registration.track.split(',').map(track => track.trim()).filter(Boolean),
                        room: '',
                        roomWifiSSID: '',
                        roomWifiPass: '',
                        coordinator: { name: '', phone: '', assigned_judge: '', assigned_judge_2: '' },
                        submission: { github: '', presentation: '', demo: '', deployment: '', isFinal: false },
                        roundScores: {},
                        roundDetailedScores: {},
                        roundComments: {},
                        isCheckedIn: false,
                        checkedInAt: null,
                        memberMealState: {},
                        createdAt: new Date().toISOString(),
                        completedAt: null
                    };
                });

                if (teamId) {
                    teams = teams.filter(team => team.teamId.toLowerCase().includes(teamId.toLowerCase()));
                }
                return NextResponse.json(teams);
            }

            const dataPath = path.join(process.cwd(), 'data', 'registrations.json');
            if (fs.existsSync(dataPath)) {
                const localData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
                let teams = localData.map((t: any, index: number) => ({
                    id: t.teamId || `TRI-${String(index + 1).padStart(3, '0')}`,
                    name: t.teamName || "Unknown Team",
                    team: t.teamName || "Unknown Team",
                    track: t.track || "",
                    captain: t.participants?.[0]?.fullName || "N/A",
                    captainMobile: t.participants?.[0]?.phone || "",
                    college: t.participants?.[0]?.college || "",
                    teamId: t.teamId || `TRI-${String(index + 1).padStart(3, '0')}`,
                    password: t.password || "",
                    members: t.participants || [],
                    status: "REGISTERED",
                    problemStatement: t.problemStatement || "",
                    proposedIdea: "",
                    techStack: {},
                    isPSLocked: false,
                    isPILocked: false,
                    isTSLocked: false,
                    trackPreferences: [],
                    room: "",
                    roomWifiSSID: "",
                    roomWifiPass: "",
                    coordinator: { name: "", phone: "", assigned_judge: "", assigned_judge_2: "" },
                    submission: { github: "", presentation: "", demo: "", deployment: "", isFinal: false },
                    roundScores: {},
                    roundDetailedScores: {},
                    roundComments: {},
                    isCheckedIn: false,
                    checkedInAt: null,
                    memberMealState: t.memberMealState || {},
                    createdAt: new Date().toISOString(),
                    completedAt: null
                }));

                if (teamId) {
                    teams = teams.filter((t: any) => (t.teamId || '').toLowerCase().includes(teamId.toLowerCase()));
                }
                
                return NextResponse.json(teams);
            }
        }

        // Paginate through all rows to avoid Supabase's default 1000-row limit
        let allData: any[] = [];
        const PAGE_SIZE = 1000;
        let from = 0;
        let hasMore = true;

        while (hasMore) {
            let query = supabase
                .from('registrations')
                .select('*')
                .neq('status', 'MERGED')
                .order('created_at', { ascending: false })
                .range(from, from + PAGE_SIZE - 1);

            if (teamId) {
                query = query.ilike('team_id', teamId);
            }

            const { data: pageData, error: pageError } = await query;

            if (pageError) {
                console.error('❌ Supabase Error:', pageError);
                return NextResponse.json({ error: 'Database error' }, { status: 500 });
            }

            if (pageData && pageData.length > 0) {
                allData = allData.concat(pageData);
                from += PAGE_SIZE;
                hasMore = pageData.length === PAGE_SIZE;
            } else {
                hasMore = false;
            }
        }

        const data = allData;

        const teams = (data || []).map((r: any) => ({
            id: r.transaction_id || r.id || "",
            name: r.team_name || "Unknown Team",
            team: r.team_name || "Unknown Team",
            track: r.track || "",
            captain: r.captain || "N/A",
            captainMobile: r.captain_mobile || "",
            college: r.college || "",
            teamId: r.team_id || "tricity-???",
            password: r.password || "",
            members: r.members || [],
            status: r.status || "PENDING",
            problemStatement: r.problem_statement || r.raw_data?.problemStatement || "",
            proposedIdea: r.proposed_idea || "",
            techStack: r.tech_stack || {},
            isPSLocked: r.raw_data?.ps_locked || false,
            isPILocked: r.raw_data?.pi_locked || false,
            isTSLocked: r.raw_data?.ts_locked || false,
            trackPreferences: r.raw_data?.track_preferences || [],
            room: r.room || "",
            roomWifiSSID: r.room_wifi_ssid || "",
            roomWifiPass: r.room_wifi_pass || "",
            coordinator: {
                name: r.volunteer_name || "",
                phone: r.volunteer_phone || "",
                assigned_judge: (r.assigned_judge || "").split("|")[0] || "",
                assigned_judge_2: (r.assigned_judge || "").split("|")[1] || ""
            },
            submission: {
                github: r.github_url || "",
                presentation: r.presentation_url || "",
                demo: r.demo_url || "",
                deployment: r.deployment_url || "",
                isFinal: r.is_final_submission || false
            },
            roundScores: r.round_scores || {},
            roundDetailedScores: r.round_detailed_scores || {},
            roundComments: r.round_comments || {},
            isCheckedIn: r.is_checked_in || false,
            checkedInAt: r.raw_data?.checkedInAt || null,
            memberMealState: r.raw_data?.memberMealState || {},
            createdAt: r.created_at,
            completedAt: r.completed_at
        }));

        return NextResponse.json(teams);
    } catch (error) {
        console.error('❌ Failed to fetch teams from Supabase:', error);
        return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const { id, problemStatement, proposedIdea, techStack, submission, roundScores, roundComments, roundDetailedScores, isCheckedIn, checkedInAt, room, volunteer_name, volunteer_phone, roomWifiSSID, roomWifiPass, assigned_judge, assigned_judge_2, members, memberMealState, transferMembers } = await req.json();

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        if (process.env.USE_SUPABASE_REGISTRATIONS !== 'true' && transferMembers !== undefined) {
            if (!Array.isArray(transferMembers)) {
                return NextResponse.json({ error: 'transferMembers must be an array.' }, { status: 400 });
            }
            try {
                const result = transferLocalTeamMembers(String(id), transferMembers);
                return NextResponse.json({ success: true, ...result });
            } catch (error) {
                return NextResponse.json({
                    error: error instanceof Error ? error.message : 'Failed to move participants.'
                }, { status: 400 });
            }
        }

        if (process.env.USE_SUPABASE_REGISTRATIONS !== 'true' && members !== undefined) {
            const currentTeam = getLocalTeams().find(team => String(team.teamId || team.id) === String(id));
            if (!currentTeam) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
            if (members.length > MAX_TEAM_MEMBERS && members.length > currentTeam.members.length) {
                return NextResponse.json({ error: `Teams are limited to ${MAX_TEAM_MEMBERS} participants.` }, { status: 400 });
            }
            const updatedTeam = updateLocalTeamById(String(id), {
                members,
                ...(memberMealState !== undefined ? { memberMealState } : {})
            });
            if (!updatedTeam) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
            return NextResponse.json({ success: true });
        }

        const updateData: any = {};
        if (members !== undefined) updateData.members = members;

        // Participant-owned fields — fetch current raw_data to merge lock flags
        const isParticipantUpdate = problemStatement !== undefined || proposedIdea !== undefined || techStack !== undefined;
        if (isParticipantUpdate) {
            const { data: existing } = await supabase
                .from('registrations')
                .select('raw_data')
                .or(`transaction_id.eq."${id}",team_id.eq."${id}"`)
                .single();
            const rawData = existing?.raw_data || {};
            if (problemStatement !== undefined) {
                updateData.problem_statement = problemStatement;
                rawData.ps_locked = true;
            }
            if (proposedIdea !== undefined) {
                updateData.proposed_idea = proposedIdea;
                rawData.pi_locked = true;
            }
            if (techStack !== undefined) {
                updateData.tech_stack = techStack;
                rawData.ts_locked = true;
            }
            updateData.raw_data = rawData;
        }

        // Fetch raw_data for new properties if it's not already fetched
        if (!isParticipantUpdate && (checkedInAt !== undefined || memberMealState !== undefined)) {
            const { data: existing } = await supabase
                .from('registrations')
                .select('raw_data')
                .or(`transaction_id.eq."${id}",team_id.eq."${id}"`)
                .single();
            const rawData = existing?.raw_data || {};
            if (checkedInAt !== undefined) rawData.checkedInAt = checkedInAt;
            if (memberMealState !== undefined) rawData.memberMealState = memberMealState;
            updateData.raw_data = rawData;
        } else if (isParticipantUpdate && (checkedInAt !== undefined || memberMealState !== undefined)) {
            if (checkedInAt !== undefined) updateData.raw_data.checkedInAt = checkedInAt;
            if (memberMealState !== undefined) updateData.raw_data.memberMealState = memberMealState;
        }

        if (roundScores !== undefined) updateData.round_scores = roundScores;
        if (roundComments !== undefined) updateData.round_comments = roundComments;
        if (roundDetailedScores !== undefined) updateData.round_detailed_scores = roundDetailedScores;
        if (isCheckedIn !== undefined) updateData.is_checked_in = isCheckedIn;
        if (room !== undefined) updateData.room = room;
        if (volunteer_name !== undefined) updateData.volunteer_name = volunteer_name;
        if (volunteer_phone !== undefined) updateData.volunteer_phone = volunteer_phone;
        if (assigned_judge !== undefined || assigned_judge_2 !== undefined) {
            updateData.assigned_judge = `${assigned_judge || ""}|${assigned_judge_2 || ""}`;
        }
        if (roomWifiSSID !== undefined) updateData.room_wifi_ssid = roomWifiSSID;
        if (roomWifiPass !== undefined) updateData.room_wifi_pass = roomWifiPass;
        if (submission) {
            if (submission.github !== undefined) updateData.github_url = submission.github;
            if (submission.presentation !== undefined) updateData.presentation_url = submission.presentation;
            if (submission.demo !== undefined) updateData.demo_url = submission.demo;
            if (submission.deployment !== undefined) updateData.deployment_url = submission.deployment;
            if (submission.isFinal !== undefined) updateData.is_final_submission = submission.isFinal;
        }

        const { error } = await supabase
            .from('registrations')
            .update(updateData)
            .or(`transaction_id.eq."${id}",team_id.eq."${id}"`);

        if (error) {
            console.error('❌ Update Error:', error);
            return NextResponse.json({ error: 'Failed to update', details: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('❌ PATCH API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
