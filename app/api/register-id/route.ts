import { NextResponse } from 'next/server';
import { teamSupabase as supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Fetch all team IDs to find gaps
        const { data: allRegistrations, error } = await supabase
            .from('registrations')
            .select('team_id');

        if (error) {
            console.error("âŒ Error fetching registrations:", error);
            throw error;
        }

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

        const nextId = `TRICITY_${nextNum}`;

        return NextResponse.json({ success: true, nextId });
    } catch (error: any) {
        console.error("ðŸ Register-ID Route Exception:", error);
        return NextResponse.json({
            success: false,
            error: error.message || String(error),
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
