import { NextResponse } from 'next/server';
import { teamSupabase as supabase } from '@/lib/supabase';

/**
 * Expected Payload Format:
 * {
 *   "registrations": [
 *     {
 *       "participants": [
 *         { "fullName": "Alice", "email": "alice@ex.com", "phone": "123", "college": "ABC" },
 *         ... up to 4 participants
 *       ],
 *       "track": "General",
 *       "problemStatement": "Description of the idea"
 *     }
 *   ]
 * }
 */

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const incomingRegs = body.registrations;

        if (!incomingRegs || !Array.isArray(incomingRegs)) {
            return NextResponse.json({ error: 'Invalid payload format. Expected { "registrations": [...] }' }, { status: 400 });
        }

        const toInsert = incomingRegs.map((reg: any, index: number) => {
            const participants = reg.participants || [];
            const count = participants.length;

            let entry_type = 'INDIVIDUAL';
            if (count === 2) entry_type = 'DUO';
            if (count > 2) entry_type = 'SQUAD';

            const captain = participants[0] || {};
            const teamName = reg.teamName || captain.fullName || `Participant ${index + 1}`;

            return {
                team_name: teamName,
                track: reg.track || 'TBD',
                problem_statement: reg.problemStatement || '',
                college: captain.college || '',
                captain: captain.fullName || '',
                captain_mobile: captain.phone || '',
                email: captain.email || '',
                members: participants, // array of objects
                entry_type: entry_type,
                status: 'PENDING',
                raw_data: reg // Keep full payload
            };
        });

        const { data, error } = await supabase
            .from('registrations')
            .insert(toInsert)
            .select('transaction_id, entry_type, team_name');

        if (error) {
            console.error('❌ Supabase Insert Error:', error);
            return NextResponse.json({ error: 'Failed to insert registrations', details: error.message }, { status: 500 });
        }

        return NextResponse.json({ 
            success: true, 
            imported: data?.length || 0,
            message: `Successfully imported ${data?.length || 0} registrations.`
        });

    } catch (error: any) {
        console.error('❌ Import Registrations API Error:', error);
        return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
    }
}
