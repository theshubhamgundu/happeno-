import { NextResponse } from 'next/server';
import { getSession, hasRole } from '@/lib/session';
import { redis } from '@/lib/redis';
import { supabase } from '@/lib/supabase';

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

async function loadTickets(): Promise<HelpTicket[]> {
    if (redis) {
        try {
            const raw = await redis.get(HELP_QUEUE_KEY);
            if (raw) {
                return typeof raw === 'string' ? JSON.parse(raw) : (raw as HelpTicket[]);
            }
        } catch (e) {
            console.warn('Redis read failed, attempting Supabase fallback:', e);
        }
    }

    try {
        const { data, error } = await supabase
            .from('hackathon_settings')
            .select('value')
            .eq('key', HELP_QUEUE_KEY)
            .maybeSingle();
        if (error) {
            console.error('Supabase tickets read error:', error);
            return [];
        }
        if (data?.value) {
            return Array.isArray(data.value) ? (data.value as HelpTicket[]) : [];
        }
    } catch (e) {
        console.error('Failed to read tickets from Supabase:', e);
    }
    return [];
}

async function persistTickets(tickets: HelpTicket[]): Promise<boolean> {
    let saved = false;
    if (redis) {
        try {
            await redis.set(HELP_QUEUE_KEY, JSON.stringify(tickets));
            saved = true;
        } catch (e) {
            console.warn('Redis write failed, attempting Supabase fallback:', e);
        }
    }

    try {
        const { error } = await supabase
            .from('hackathon_settings')
            .upsert({
                key: HELP_QUEUE_KEY,
                value: tickets,
                updated_at: new Date().toISOString()
            });
        if (!error) saved = true;
    } catch (e) {
        console.error('Failed to persist tickets to Supabase:', e);
    }

    return saved;
}

// GET: Fetch all help tickets (admin/volunteer) or own tickets (team)
export async function GET(req: Request) {
    const session = getSession(req);
    if (!hasRole(session, ['admin', 'volunteer', 'team'])) {
        return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    try {
        let tickets = await loadTickets();

        // Teams can only see their own tickets
        if (session.role === 'team') {
            tickets = tickets.filter(t => t.teamId === session.teamId);
        }

        return NextResponse.json(tickets);
    } catch (error) {
        console.error('Failed to fetch help tickets:', error);
        return NextResponse.json({ error: 'Could not fetch help tickets.' }, { status: 500 });
    }
}

// POST: Create a new help ticket (team) or update status (admin/volunteer/team)
export async function POST(req: Request) {
    const session = getSession(req);
    if (!hasRole(session, ['admin', 'volunteer', 'team'])) {
        return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const tickets = await loadTickets();

        // Team-initiated action
        if (session.role === 'team') {
            const { action, ticketId, category, description, tableNumber, teamName } = body;

            // Team canceling their own ticket
            if (action === 'cancel' && ticketId) {
                const ticketIndex = tickets.findIndex(t => t.id === ticketId);
                if (ticketIndex === -1) {
                    return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });
                }
                if (tickets[ticketIndex].teamId !== session.teamId) {
                    return NextResponse.json({ error: 'Unauthorized to cancel this ticket.' }, { status: 403 });
                }
                tickets.splice(ticketIndex, 1);
                await persistTickets(tickets);
                return NextResponse.json({ success: true, tickets: tickets.filter(t => t.teamId === session.teamId) });
            }

            // Creating a new ticket
            if (!category || !description) {
                return NextResponse.json({ error: 'Category and description are required.' }, { status: 400 });
            }

            // Limit: max 3 open/accepted tickets per team
            const activeTickets = tickets.filter(t => t.teamId === session.teamId && (t.status === 'open' || t.status === 'accepted'));
            if (activeTickets.length >= 3) {
                return NextResponse.json({ error: 'You already have 3 active help requests. Please wait for one to be resolved.' }, { status: 429 });
            }

            const newTicket: HelpTicket = {
                id: `HT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                teamId: session.teamId || '',
                teamName: teamName || session.name || 'Unknown Team',
                category,
                description: String(description).trim(),
                tableNumber: tableNumber ? String(tableNumber).trim() : '',
                status: 'open',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            tickets.unshift(newTicket);
            await persistTickets(tickets);

            return NextResponse.json({ success: true, ticket: newTicket, tickets: tickets.filter(t => t.teamId === session.teamId) });
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

        const staffName = session.name || session.id || 'Staff';

        if (action === 'accept') {
            tickets[ticketIndex].status = 'accepted';
            tickets[ticketIndex].acceptedBy = staffName;
            tickets[ticketIndex].updatedAt = new Date().toISOString();
        } else if (action === 'resolve') {
            tickets[ticketIndex].status = 'resolved';
            tickets[ticketIndex].updatedAt = new Date().toISOString();
        } else if (action === 'cancel') {
            tickets.splice(ticketIndex, 1);
        }

        await persistTickets(tickets);

        return NextResponse.json({ success: true, tickets });
    } catch (error) {
        console.error('Failed to process help ticket:', error);
        return NextResponse.json({ error: 'Could not process help ticket.' }, { status: 500 });
    }
}
