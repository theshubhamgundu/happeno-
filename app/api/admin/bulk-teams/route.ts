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
        const { action, teamIds, updates, clearIdeation } = body as {
            action?: 'delete' | 'update' | 'clear_submissions';
            teamIds?: string[] | 'all';
            clearIdeation?: boolean;
            updates?: {
                track?: string;
                room?: string;
                roomWifiSSID?: string;
                roomWifiPass?: string;
                isCheckedIn?: boolean;
            };
        };

        if (action === 'clear_submissions') {
            const isAll = teamIds === 'all' || (Array.isArray(teamIds) && teamIds.includes('all'));
            const ids = Array.isArray(teamIds) ? teamIds.map(id => String(id).trim()).filter(Boolean) : [];

            if (!isAll && ids.length === 0) {
                return NextResponse.json({ success: false, error: 'No teams selected.' }, { status: 400 });
            }

            // Fetch target teams
            let query = supabase
                .from('registrations')
                .select('transaction_id, team_id, raw_data')
                .neq('status', 'MERGED');

            if (!isAll) {
                query = query.or(`team_id.in.(${ids.join(',')}),transaction_id.in.(${ids.join(',')})`);
            }

            const { data: targetRows, error: fetchErr } = await query;
            if (fetchErr) throw fetchErr;

            const targetCount = targetRows?.length || 0;

            if (targetCount > 0) {
                if (!clearIdeation) {
                    // Instant single query batch update for all target teams
                    const updateFields: Record<string, unknown> = {
                        github_url: null,
                        presentation_url: null,
                        demo_url: null,
                        deployment_url: null,
                        is_final_submission: false
                    };

                    let updateQuery = supabase.from('registrations').update(updateFields);
                    if (isAll) {
                        updateQuery = updateQuery.neq('status', 'MERGED');
                    } else {
                        const targetTxIds = (targetRows || []).map(r => r.transaction_id);
                        updateQuery = updateQuery.in('transaction_id', targetTxIds);
                    }

                    const { error: updateErr } = await updateQuery;
                    if (updateErr) throw updateErr;
                } else {
                    // Concurrently update raw_data locks in parallel batches of 25
                    const batchSize = 25;
                    for (let i = 0; i < targetRows!.length; i += batchSize) {
                        const chunk = targetRows!.slice(i, i + batchSize);
                        await Promise.all(chunk.map(row => {
                            const raw = (row.raw_data && typeof row.raw_data === 'object') ? { ...(row.raw_data as any) } : {};
                            raw.ps_locked = false;
                            raw.pi_locked = false;
                            raw.ts_locked = false;

                            return supabase
                                .from('registrations')
                                .update({
                                    github_url: null,
                                    presentation_url: null,
                                    demo_url: null,
                                    deployment_url: null,
                                    is_final_submission: false,
                                    problem_statement: null,
                                    proposed_idea: null,
                                    tech_stack: null,
                                    raw_data: raw
                                })
                                .eq('transaction_id', row.transaction_id);
                        }));
                    }
                }
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

            return NextResponse.json({ 
                success: true, 
                count: targetRows?.length || 0,
                message: `Successfully cleared submissions for ${targetRows?.length || 0} teams.` 
            });
        }

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
