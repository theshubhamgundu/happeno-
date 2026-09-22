import { NextResponse } from 'next/server';
import { teamSupabase as supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

const useLocalDb = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const dataPath = path.join(process.cwd(), 'data', 'registrations.json');

// GET: Fetch a team's registration by team_id and password
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const teamId = searchParams.get('teamId');
        const password = searchParams.get('password');

        if (!teamId || !password) {
            return NextResponse.json(
                { error: 'Team ID and password are required' },
                { status: 400 }
            );
        }

        if (useLocalDb) {
            if (fs.existsSync(dataPath)) {
                const localData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
                const team = localData.find((t: any, index: number) => 
                    (t.teamId === teamId || `LOCAL-${index}` === teamId) && t.password === password
                );

                if (!team) {
                    return NextResponse.json({ error: 'Invalid Team ID or Password. Please check and try again.' }, { status: 404 });
                }

                const safeData = {
                    teamId: team.teamId || teamId,
                    teamName: team.teamName || "Unknown Team",
                    track: team.track || "",
                    captain: team.participants?.[0]?.fullName || "",
                    captainMobile: team.participants?.[0]?.phone || "",
                    college: team.participants?.[0]?.college || "",
                    email: team.participants?.[0]?.email || "",
                    members: team.participants || [],
                    status: "REGISTERED",
                    problemStatement: team.problemStatement || "",
                    createdAt: new Date().toISOString(),
                };
                return NextResponse.json({ success: true, team: safeData });
            }
        }

        const { data, error } = await supabase
            .from('registrations')
            .select('*')
            .ilike('team_id', teamId)
            .eq('password', password)
            .maybeSingle();

        if (error) {
            console.error('❌ Participant lookup error:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json(
                { error: 'Invalid Team ID or Password. Please check and try again.' },
                { status: 404 }
            );
        }

        // Return only safe fields — no admin-only data
        const safeData = {
            teamId: data.team_id,
            teamName: data.team_name,
            track: data.track || '',
            captain: data.captain || '',
            captainMobile: data.captain_mobile || '',
            college: data.college || '',
            email: data.email || '',
            members: data.members || [],
            status: data.status || 'PENDING',
            problemStatement: data.problem_statement || '',
            createdAt: data.created_at,
        };

        return NextResponse.json({ success: true, team: safeData });
    } catch (error) {
        console.error('❌ Participant lookup failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PATCH: Update participant-owned fields
export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { teamId, password, teamName, captain, captainMobile, college, email, members } = body;

        if (!teamId || !password) {
            return NextResponse.json(
                { error: 'Team ID and password are required for verification' },
                { status: 400 }
            );
        }

        // Re-verify credentials before allowing update
        if (useLocalDb) {
            if (fs.existsSync(dataPath)) {
                const localData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
                const teamIndex = localData.findIndex((t: any, index: number) => 
                    (t.teamId === teamId || `LOCAL-${index}` === teamId) && t.password === password
                );

                if (teamIndex === -1) {
                    return NextResponse.json({ error: 'Authentication failed. Invalid Team ID or Password.' }, { status: 403 });
                }

                // Update fields
                if (teamName !== undefined) localData[teamIndex].teamName = teamName;
                if (members !== undefined) localData[teamIndex].participants = members;
                
                fs.writeFileSync(dataPath, JSON.stringify(localData, null, 2), 'utf8');
                return NextResponse.json({ success: true, message: 'Details updated successfully in local DB!' });
            }
        }

        const { data: existing, error: lookupError } = await supabase
            .from('registrations')
            .select('team_id, password')
            .ilike('team_id', teamId)
            .eq('password', password)
            .maybeSingle();

        if (lookupError || !existing) {
            return NextResponse.json(
                { error: 'Authentication failed. Invalid Team ID or Password.' },
                { status: 403 }
            );
        }

        // Build the update payload — only participant-editable fields
        const updateData: any = {};
        if (teamName !== undefined) updateData.team_name = teamName;
        if (captain !== undefined) updateData.captain = captain;
        if (captainMobile !== undefined) updateData.captain_mobile = captainMobile;
        if (college !== undefined) updateData.college = college;
        if (email !== undefined) updateData.email = email;
        if (members !== undefined) updateData.members = members;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        const { error: updateError } = await supabase
            .from('registrations')
            .update(updateData)
            .ilike('team_id', teamId);

        if (updateError) {
            console.error('❌ Participant update error:', updateError);
            return NextResponse.json(
                { error: 'Failed to update details', details: updateError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, message: 'Details updated successfully!' });
    } catch (error) {
        console.error('❌ Participant update failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
