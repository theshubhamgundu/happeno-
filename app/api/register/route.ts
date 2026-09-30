import { NextResponse } from 'next/server';
import { teamSupabase as supabase } from '@/lib/supabase';

export async function POST(req: Request) {
    if (process.env.PUBLIC_REGISTRATIONS_OPEN !== 'true') {
        return NextResponse.json({ success: false, message: 'Registrations are closed.' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { teamName, domain, members, userTransactionId, teamId } = body;

        if (typeof teamName !== 'string' || !teamName.trim() || teamName.length > 120 ||
            typeof domain !== 'string' || !domain.trim() || domain.length > 120 ||
            typeof userTransactionId !== 'string' || !userTransactionId.trim() || userTransactionId.length > 128 ||
            !Array.isArray(members) || members.length < 1 || members.length > 4 || typeof teamId !== 'string') {
            return NextResponse.json({ success: false, message: "Missing required fields (including Team ID and Transaction ID)" }, { status: 400 });
        }
        if (members.some(member => !member ||
            typeof member.fullName !== 'string' || !member.fullName.trim() ||
            typeof member.email !== 'string' || !/^\S+@\S+\.\S+$/.test(member.email) ||
            typeof member.phone !== 'string' || !member.phone.trim() ||
            typeof member.college !== 'string' || !member.college.trim())) {
            return NextResponse.json({ success: false, message: 'Every team member must have valid name, email, phone, and college details.' }, { status: 400 });
        }

        // Use the manual transaction ID provided by the user
        const transactionId = userTransactionId.trim();

        const nextTeamId = String(teamId).trim();
        const teamNumber = Number(nextTeamId.match(/(\d+)$/)?.[1]);
        if (!/^TRICITY_\d+$/.test(nextTeamId) || !Number.isSafeInteger(teamNumber)) {
            return NextResponse.json({ success: false, message: 'Invalid team ID reservation.' }, { status: 400 });
        }

        const { data: existingTeam, error: lookupError } = await supabase
            .from('registrations')
            .select('team_id')
            .eq('team_id', nextTeamId)
            .maybeSingle();
        if (lookupError) throw lookupError;
        if (existingTeam) {
            return NextResponse.json({ success: false, message: 'This team ID has already been used. Request a new ID.' }, { status: 409 });
        }

        // Save registration as PENDING verification
        const { error: sbError } = await supabase
            .from('registrations')
            .insert([
                {
                    team_id: nextTeamId, // Use server-generated ID
                    transaction_id: transactionId,
                    team_name: teamName,
                    track: domain,
                    status: 'PENDING', // Waiting for Admin to verify payment
                    members: members,
                    email: members[0].email,
                    captain: members[0].fullName,
                    captain_mobile: members[0].phone,
                    college: members[0].college,
                    raw_data: body,
                    password_hash: null,
                    credentials_issued_at: null,
                    created_at: new Date().toISOString()
                }
            ]);

        if (sbError) {
            console.error("❌ Failed to save to Supabase:", sbError);
            return NextResponse.json({
                success: false,
                message: sbError.code === '23505' ? 'This transaction or team ID has already been registered.' : 'Database save failed.'
            }, { status: sbError.code === '23505' ? 409 : 503 });
        }

        return NextResponse.json({
            success: true,
            teamName: teamName,
            transactionId: transactionId,
            teamId: nextTeamId
        });

    } catch (error: unknown) {
        console.error('Registration failed:', error);
        return NextResponse.json({
            success: false,
            message: 'Registration could not be saved to Supabase.'
        }, { status: 503 });
    }
}