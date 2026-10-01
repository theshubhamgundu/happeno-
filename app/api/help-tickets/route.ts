import { NextResponse } from 'next/server';
import { getSession, hasRole } from '@/lib/session';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

const HELP_QUEUE_KEY = 'help_tickets_queue';

export interface HelpTicket {
    id: string;
    teamId: string;
    teamName: string;
    category: string;
    description: string;
    tableNumber?: string;
    status: 'open' | 'accepted' | 'resolved';
    acceptedBy?: string;
    createdAt: string;
    updatedAt: string;
}

// GET: Fetch all help tickets (admin/volunteer) or own tickets (team)
export async function GET(req: Request) {
    const session = getSession(req);
    if (!hasRole(session, ['admin', 'volunteer', 'team'])) {
        return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    if (!redis) {
        return NextResponse.json({ error: 'Help system requires Redis.' }, { status: 503 });
    }

    try {
        const raw = await redis.get(HELP_QUEUE_KEY);
        let tickets: HelpTicket[] = [];
        if (raw) {
            tickets = typeof raw === 'string' ? JSON.parse(raw) : raw;
        }

        // Teams can only see their own tickets
        if (session.role === 'team') {
            tickets = tickets.filter(t => t.teamId === session.teamId);
        }

        return NextResponse.json(tickets);
    } catch (error) {
        console.error('Failed to fetch help tickets:', error);
        return NextResponse.json({ error: 'Could not fetch help tickets.' }, { status: 503 });
    }
}

// POST: Create a new help ticket (team) or update status (admin/volunteer)
export async function POST(req: Request) {
    const session = getSession(req);
    if (!hasRole(session, ['admin', 'volunteer', 'team'])) {
        return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    if (!redis) {
        return NextResponse.json({ error: 'Help system requires Redis.' }, { status: 503 });
    }

    try {
        const body = await req.json();
        const raw = await redis.get(HELP_QUEUE_KEY);
        let tickets: HelpTicket[] = [];
        if (raw) {
            tickets = typeof raw === 'string' ? JSON.parse(raw) : raw;
        }

        // Team creating a new ticket
        if (session.role === 'team') {
            const { category, description, tableNumber, teamName } = body;
            if (!category || !description) {
                return NextResponse.json({ error: 'Category and description are required.' }, { status: 400 });
            }

            // Limit: max 3 open tickets per team
            const openTickets = tickets.filter(t => t.teamId === session.teamId && t.status === 'open');
            if (openTickets.length >= 3) {
                return NextResponse.json({ error: 'You already have 3 open help requests. Please wait for one to be resolved.' }, { status: 429 });
            }

            const newTicket: HelpTicket = {
                id: `HT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                teamId: session.teamId || '',
                teamName: teamName || session.name || 'Unknown Team',
                category,
                description,
                tableNumber: tableNumber || '',
                status: 'open',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            tickets.unshift(newTicket);
            await redis.set(HELP_QUEUE_KEY, JSON.stringify(tickets));

            return NextResponse.json({ success: true, ticket: newTicket });
        }

        // Admin/Volunteer updating ticket status
        const { ticketId, action } = body;
        if (!ticketId || !['accept', 'resolve', 'cancel'].includes(action)) {
            return NextResponse.json({ error: 'ticketId and action (accept/resolve/cancel) are required.' }, { status: 400 });
        }

        const ticketIndex = tickets.findIndex(t => t.id === ticketId);
        if (ticketIndex === -1) {
            return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });
        }

        if (action === 'accept') {
            tickets[ticketIndex].status = 'accepted';
            tickets[ticketIndex].acceptedBy = session.name || session.id || 'Staff';
            tickets[ticketIndex].updatedAt = new Date().toISOString();
        } else if (action === 'resolve') {
            tickets[ticketIndex].status = 'resolved';
            tickets[ticketIndex].updatedAt = new Date().toISOString();
        } else if (action === 'cancel') {
            tickets.splice(ticketIndex, 1);
        }

        await redis.set(HELP_QUEUE_KEY, JSON.stringify(tickets));

        return NextResponse.json({ success: true, tickets });
    } catch (error) {
        console.error('Failed to process help ticket:', error);
        return NextResponse.json({ error: 'Could not process help ticket.' }, { status: 503 });
    }
}
