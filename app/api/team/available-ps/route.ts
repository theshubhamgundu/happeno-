import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { getProblemStatementsForTrack, isOpenInnovationTrack } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const track = searchParams.get('track');

    if (!track) {
        return NextResponse.json({ success: false, error: 'Track is required' }, { status: 400 });
    }

    if (isOpenInnovationTrack(track)) {
        return NextResponse.json({ success: true, availability: {} }); // No limits for open innovation
    }

    const statements = getProblemStatementsForTrack(track);
    if (!statements.length) {
        return NextResponse.json({ success: true, availability: {} });
    }

    if (!redis) {
        return NextResponse.json({ success: false, error: 'Redis is not configured' }, { status: 503 });
    }

    const MAX_TEAMS_PER_PS = 10;
    const availability: Record<string, { used: number, total: number, isFull: boolean }> = {};

    try {
        // Generate keys for all statements in this track
        const keys = statements.map(ps => {
            const cleanKey = ps.substring(0, 100).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            return `ps_slots_${cleanKey}`;
        });

        // Use mget to fetch all counts in a single Redis roundtrip
        const counts = await redis.mget<number[]>(...keys);

        statements.forEach((ps, idx) => {
            const used = Number(counts[idx]) || 0;
            availability[ps] = {
                used,
                total: MAX_TEAMS_PER_PS,
                isFull: used >= MAX_TEAMS_PER_PS
            };
        });

        return NextResponse.json({ success: true, availability });
    } catch (err) {
        console.error("Failed to fetch PS availability:", err);
        return NextResponse.json({ success: false, error: 'Failed to fetch availability' }, { status: 500 });
    }
}
