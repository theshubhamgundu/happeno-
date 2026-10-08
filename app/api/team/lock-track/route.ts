import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession, hasRole } from '@/lib/session';
import { getParticipantPortalMode } from '@/lib/event-windows';
import { redis } from '@/lib/redis';
import { isOpenInnovationTrack, MAX_OPEN_INNOVATION_PROBLEM_CHARACTERS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const session = getSession(req);
    if (!hasRole(session, ['team', 'admin']) || (!session.teamId && session.role !== 'admin')) {
        return NextResponse.json({ success: false, message: 'Team authentication required. Please sign in again.' }, { status: 401 });
    }

    const portalMode = session.portalMode || await getParticipantPortalMode();
    const isDevelopment = process.env.NODE_ENV !== 'production';

    if (!isDevelopment && session.role === 'team' && portalMode !== 'event') {
        return NextResponse.json({ success: false, message: 'Team dashboard access is available only October 10–11, 2026 (IST).' }, { status: 403 });
    }

    try {
        const body = await req.json().catch(() => ({}));
        const track = typeof body.track === 'string' ? body.track.trim() : '';
        const problemStatement = typeof body.problemStatement === 'string' ? body.problemStatement.trim() : '';
        const teamIdFromBody = typeof body.teamId === 'string' ? body.teamId.trim() : '';
        const targetTeamId = (session.role === 'admin' && teamIdFromBody) ? teamIdFromBody : (session.teamId || teamIdFromBody);

        if (!targetTeamId || !track || !problemStatement) {
            return NextResponse.json({ success: false, message: "Missing required fields (track, problem statement, or team ID)." }, { status: 400 });
        }
        if (isOpenInnovationTrack(track) && problemStatement.length > MAX_OPEN_INNOVATION_PROBLEM_CHARACTERS) {
            return NextResponse.json({
                success: false,
                message: `Open Innovation problem statements must be ${MAX_OPEN_INNOVATION_PROBLEM_CHARACTERS} characters or fewer.`
            }, { status: 400 });
        }

        const { data: existing, error: lookupError } = await supabase
            .from('registrations')
            .select('transaction_id, team_id, track, problem_statement, raw_data')
            .or(`team_id.eq.${targetTeamId},transaction_id.eq.${targetTeamId}`)
            .maybeSingle();

        if (lookupError) throw lookupError;
        if (!existing) {
            return NextResponse.json({ success: false, message: `Team not found with ID ${targetTeamId}.` }, { status: 404 });
        }

        const rawData = existing.raw_data && typeof existing.raw_data === 'object'
            ? { ...existing.raw_data }
            : {};

        if (rawData.ps_locked === true && existing.track && existing.problem_statement) {
            return NextResponse.json({
                success: true,
                message: 'The track and problem statement are already locked.',
                track: existing.track,
                problemStatement: existing.problem_statement,
                alreadyLocked: true
            });
        }
        // --- Slot Limit Enforcement (10 teams max per Problem Statement) ---
        const MAX_TEAMS_PER_PS = 10;
        let redisKey = '';
        let slotIncremented = false;

        // Open Innovation has no limits. Only check if redis is available and it's a predefined track.
        if (redis && !isOpenInnovationTrack(track)) {
            // Generate a safe unique key for this problem statement
            const cleanKey = problemStatement.substring(0, 100).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            redisKey = `ps_slots_${cleanKey}`;

            try {
                // Atomically increment the slot counter
                const currentSlots = await redis.incr(redisKey);
                
                if (currentSlots > MAX_TEAMS_PER_PS) {
                    // Revert the increment since it's full
                    await redis.decr(redisKey);
                    return NextResponse.json({ 
                        success: false, 
                        message: `Sorry, this problem statement has reached its maximum limit of ${MAX_TEAMS_PER_PS} teams. Please choose another one.` 
                    }, { status: 400 });
                }
                
                slotIncremented = true;
            } catch (err) {
                console.error("Redis slot increment failed:", err);
                // In a production environment, if redis fails, we might want to fail the request 
                // or fallback to a DB check. For now, we will fail safe to prevent overallocation.
                return NextResponse.json({ success: false, message: "Could not verify problem statement availability. Please try again." }, { status: 500 });
            }
        }
        // ------------------------------------------------------------------

        rawData.ps_locked = true;
        rawData.track = track;
        rawData.problem_statement = problemStatement;
        rawData.problemStatement = problemStatement;

        const { error: updateError } = await supabase
            .from('registrations')
            .update({
                track: track,
                problem_statement: problemStatement,
                raw_data: rawData
            })
            .eq('team_id', existing.team_id || targetTeamId);

        if (updateError) {
            console.error("Failed to lock track:", updateError);
            
            // ROLLBACK the Redis slot if the DB update failed
            if (slotIncremented && redisKey) {
                try {
                    await redis.decr(redisKey);
                } catch (e) {
                    console.error("Failed to rollback Redis slot:", e);
                }
            }

            return NextResponse.json({ success: false, message: "Database update failed", details: updateError.message }, { status: 500 });
        }

        if (redis) {
            try {
                await redis.del('all_teams_cache_admin');
                await redis.del('all_teams_cache_livescore');
            } catch (e) {
                console.error('Redis cache invalidate error:', e);
            }
        }

        return NextResponse.json({ success: true, track, problemStatement });

    } catch (error: unknown) {
        console.error('Lock Track Error:', error);
        return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Server error" }, { status: 500 });
    }
}
