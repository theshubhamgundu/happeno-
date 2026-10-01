import { NextResponse } from 'next/server';
import { getSession, hasRole } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const session = getSession(req);
    if (!hasRole(session, ['admin'])) {
        return NextResponse.json({ success: false, error: 'Administrator authentication required.' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { action, teamIds, updates } = body as {
            action?: 'delete' | 'update';
            teamIds?: string[];
            updates?: {
                track?: string;
                room?: string;
                roomWifiSSID?: string;
                roomWifiPass?: string;
                isCheckedIn?: boolean;
            };
        };

        if (!Array.isArray(teamIds) || teamIds.length === 0) {
            return NextResponse.json({ success: false, error: 'No teams selected.' }, { status: 400 });
        }

        const ids = teamIds.map(id => String(id).trim()).filter(Boolean);
        if (ids.length === 0) {
            return NextResponse.json({ success: false, error: 'No valid team IDs provided.' }, { status: 400 });
        }

        if (action === 'delete') {
            // Delete registrations by team_id and transaction_id
            const { error: teamError } = await supabase
                .from('registrations')
                .delete()
                .in('team_id', ids);
            if (teamError) {
                console.error('Delete by team_id error:', teamError);
            }

            const { error: txError } = await supabase
                .from('registrations')
                .delete()
                .in('transaction_id', ids);
            if (txError) {
                console.error('Delete by transaction_id error:', txError);
            }

            // Invalidate redis cache
            if (redis) {
                try {
                    await redis.del('all_teams_cache_admin');
                    await redis.del('all_teams_cache_livescore');
                } catch (e) {
                    console.error('Redis cache invalidate error:', e);
                }
            }

            return NextResponse.json({ success: true, count: ids.length });
        }

        if (action === 'update' && updates) {
            const dbUpdates: Record<string, unknown> = {};
            if (updates.track !== undefined) dbUpdates.track = updates.track;
            if (updates.room !== undefined) dbUpdates.room = updates.room;
            if (updates.roomWifiSSID !== undefined) dbUpdates.room_wifi_ssid = updates.roomWifiSSID;
            if (updates.roomWifiPass !== undefined) dbUpdates.room_wifi_pass = updates.roomWifiPass;
            if (updates.isCheckedIn !== undefined) {
                dbUpdates.is_checked_in = updates.isCheckedIn;
            }

            if (Object.keys(dbUpdates).length === 0) {
                return NextResponse.json({ success: false, error: 'No fields to update.' }, { status: 400 });
            }

            const { error: teamError } = await supabase
                .from('registrations')
                .update(dbUpdates)
                .in('team_id', ids);
            if (teamError) {
                console.error('Update by team_id error:', teamError);
            }

            const { error: txError } = await supabase
                .from('registrations')
                .update(dbUpdates)
                .in('transaction_id', ids);
            if (txError) {
                console.error('Update by transaction_id error:', txError);
            }

            // Invalidate redis cache
            if (redis) {
                try {
                    await redis.del('all_teams_cache_admin');
                    await redis.del('all_teams_cache_livescore');
                } catch (e) {
                    console.error('Redis cache invalidate error:', e);
                }
            }

            return NextResponse.json({ success: true, count: ids.length });
        }

        return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });
    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Bulk operation failed.';
        console.error('Bulk teams operation error:', err);
        return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
    }
}
