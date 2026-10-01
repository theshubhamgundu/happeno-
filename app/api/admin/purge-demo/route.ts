import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession, hasRole } from '@/lib/session';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const session = getSession(req);
    if (!hasRole(session, ['admin'])) {
        return NextResponse.json({ success: false, error: 'Administrator access required.' }, { status: 403 });
    }

    try {
        const body = await req.json() as { confirmation?: string };
        if (body.confirmation !== 'PURGE_ALL_MOCK_REGISTRATIONS') {
            return NextResponse.json({
                success: false,
                error: 'Invalid confirmation token. Type "PURGE_ALL_MOCK_REGISTRATIONS" to confirm table wipe.'
            }, { status: 400 });
        }

        // Count existing rows before deletion
        const { count, error: countErr } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true });

        if (countErr) {
            console.error('Count error before purge:', countErr);
        }

        // Delete all rows from registrations
        // Using not equal to impossible ID to match all records in Supabase
        const { error: deleteError } = await supabase
            .from('registrations')
            .delete()
            .neq('transaction_id', 'NON_EXISTENT_ROW_ID_PLACEHOLDER');

        if (deleteError) {
            console.error('Failed to purge registrations:', deleteError);
            return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
        }

        // Clear redis cache
        if (redis) {
            try {
                await redis.del('all_teams_cache_admin');
                await redis.del('all_teams_cache_livescore');
            } catch (e) {
                console.error('Redis cache invalidate error on purge:', e);
            }
        }

        return NextResponse.json({
            success: true,
            deletedCount: count || 0,
            message: `Successfully wiped ${count || 0} registrations. The database is now ready for the official CSV import.`
        });
    } catch (error: unknown) {
        console.error('Purge demo error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to purge registrations'
        }, { status: 500 });
    }
}
