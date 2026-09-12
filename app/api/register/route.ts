import { NextResponse } from 'next/server';
import { teamSupabase as supabase } from '@/lib/supabase';

/**
 * Password formula: first 2 UPPERCASE letters of each member's name joined with "-"
 * then @VH26-[TEAM_NUMBER]
 * Example: members ["Rahul Verma", "Ankit Kumar", "Priya Nair"], team 101
 *          â†’ RA-AN-PR@VH26-101
 */
function generatePasswordFromMembers(members: any[], teamNum: number): string {
    const initials = members
        .map((m: any) => {
            const name: string = typeof m === 'string' ? m : (m.fullName || m.name || '');
            return name.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase();
        })
        .filter(Boolean)
        .join('-');

    return `${initials}@VH26-${teamNum}`;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { teamName, domain, members, userTransactionId, teamId } = body;

        console.log("ðŸš€ Registering Team (Draft):", { team: teamName, track: domain, orderId: userTransactionId, teamId });

        if (!teamName || !domain || !members || !userTransactionId || !teamId) {
            return NextResponse.json({ success: false, message: "Missing required fields (including Team ID and Transaction ID)" }, { status: 400 });
        }

        // Use the manual transaction ID provided by the user
        const transactionId = userTransactionId;

        // 1. Generate Team ID Server-Side to prevent duplicates
        // Fetch all team IDs to find gaps
        const { data: allRegistrations } = await supabase
            .from('registrations')
            .select('team_id');

        const existingNums = new Set<number>();
        if (allRegistrations) {
            allRegistrations.forEach((r: any) => {
                if (!r.team_id) return;
                const parts = r.team_id.split('_');
                if (parts.length >= 3) {
                    const num = parseInt(parts[parts.length - 1]);
                    if (!isNaN(num)) {
                        existingNums.add(num);
                    }
                }
            });
        }

        // Find the first available ID starting from 101
        let nextNum = 101;
        while (existingNums.has(nextNum)) {
            nextNum++;
        }

        const nextTeamId = `TRICITY_${nextNum}`;
        console.log(`ðŸ†” Server Generated Team ID: ${nextTeamId}`);

        // Generate unique password from members' initials
        const password = generatePasswordFromMembers(members, nextNum);
        console.log(`ðŸ”‘ Generated Password: ${password}`);

        // Save registration as PENDING verification
        const { error: sbError } = await supabase
            .from('registrations')
            .upsert([
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
                    password: password, // Auto-generated from member initials
                    created_at: new Date().toISOString()
                }
            ]);

        if (sbError) {
            console.error("âŒ Failed to save to Supabase:", sbError);
            return NextResponse.json({
                success: false,
                message: "Database save failed",
                details: sbError.message,
                code: sbError.code
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            teamName: teamName,
            transactionId: transactionId,
            teamId: nextTeamId // Return the authoritative ID
        });

    } catch (error: any) {
        console.error('âŒ Registration Error:', error);
        return NextResponse.json({
            success: false,
            message: "Registration failed",
            details: String(error)
        }, { status: 500 });
    }
}
