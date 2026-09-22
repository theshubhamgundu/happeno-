import { NextResponse } from 'next/server';
import { teamSupabase as supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

// Cache responses at the edge for 60 seconds to prevent DB spikes during high traffic
export const revalidate = 60;

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const teamId = searchParams.get('teamId');

        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            const dataPath = path.join(process.cwd(), 'data', 'registrations.json');
            if (fs.existsSync(dataPath)) {
                const localData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
                let teams = localData.map((t: any, index: number) => ({
                    id: t.teamId || `LOCAL-${index}`,
                    name: t.teamName || "Unknown Team",
                    team: t.teamName || "Unknown Team",
                    track: t.track || "",
                    captain: t.participants?.[0]?.fullName || "N/A",
                    captainMobile: t.participants?.[0]?.phone || "",
                    college: t.participants?.[0]?.college || "",
                    teamId: t.teamId || `LOCAL-${index}`,
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
                    createdAt: new Date().toISOString(),
                    completedAt: null
                }));

                if (teamId) {
                    teams = teams.filter((t: any) => (t.teamId || '').toLowerCase().includes(teamId.toLowerCase()));
                }
                
                return NextResponse.json(teams);
            }
        }

        let query = supabase
            .from('registrations')
            .select('*')
            .neq('status', 'MERGED');

        if (teamId) {
            query = query.ilike('team_id', teamId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error('âŒ Supabase Error:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

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
            createdAt: r.created_at,
            completedAt: r.completed_at
        }));

        return NextResponse.json(teams);
    } catch (error) {
        console.error('âŒ Failed to fetch teams from Supabase:', error);
        return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const { id, problemStatement, proposedIdea, techStack, submission, roundScores, roundComments, roundDetailedScores, isCheckedIn, room, volunteer_name, volunteer_phone, roomWifiSSID, roomWifiPass, assigned_judge, assigned_judge_2, members } = await req.json();

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

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
            console.error('âŒ Update Error:', error);
            return NextResponse.json({ error: 'Failed to update', details: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('âŒ PATCH API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
