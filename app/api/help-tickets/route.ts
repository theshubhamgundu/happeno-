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
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    source?: 'edit_registration' | 'dashboard' | 'email';
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
            // Fail-safe: Try to delete the stale cache to force the next read from Supabase
            try { await redis.del(HELP_QUEUE_KEY); } catch(err) {}
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

// POST: Create a new help ticket (portal/team) or update status (admin/volunteer)
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const tickets = await loadTickets();
        const session = getSession(req);

        // 1. Admin/Volunteer/Team updating or cancelling ticket status
        const { ticketId, action } = body;
        if (action && ['accept', 'resolve', 'cancel'].includes(action)) {
            if (!hasRole(session, ['admin', 'volunteer', 'team'])) {
                return NextResponse.json({ error: 'Authentication required to update ticket status.' }, { status: 401 });
            }

            const ticketIndex = tickets.findIndex(t => t.id === ticketId);
            if (ticketIndex === -1) {
                return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });
            }

            if (session.role === 'team' && action === 'cancel') {
                if (tickets[ticketIndex].teamId !== session.teamId) {
                    return NextResponse.json({ error: 'Unauthorized to cancel this ticket.' }, { status: 403 });
                }
                tickets.splice(ticketIndex, 1);
                await persistTickets(tickets);
                return NextResponse.json({ success: true, tickets: tickets.filter(t => t.teamId === session.teamId) });
            }

            if (!hasRole(session, ['admin', 'volunteer'])) {
                return NextResponse.json({ error: 'Admin or Volunteer authorization required.' }, { status: 403 });
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
        }

        // 2. Creating a new ticket (From Team Dashboard or Coordinator Support Desk on Registration page)
        const {
            category,
            description,
            tableNumber,
            teamId,
            teamName,
            contactName,
            contactPhone,
            contactEmail,
            source
        } = body;

        if (!category || !description) {
            return NextResponse.json({ error: 'Category and description are required.' }, { status: 400 });
        }

        // Determine effective team ID
        // For edit_registration source, use what was explicitly provided; do not let a stale session cookie force a team ID
        let effectiveTeamId = 'NO_TEAM_ID';
        if (typeof teamId === 'string' && teamId.trim() && teamId.trim() !== 'GUEST' && teamId.trim() !== 'NO_TEAM_ID') {
            effectiveTeamId = teamId.trim().toUpperCase();
        } else if (source !== 'edit_registration' && session?.role === 'team' && session.teamId) {
            effectiveTeamId = session.teamId;
        }

        const effectiveContactName = typeof contactName === 'string' && contactName.trim() ? contactName.trim() : (session?.name || 'Participant');
        const effectiveTeamName = typeof teamName === 'string' && teamName.trim() && teamName.trim() !== 'Visitor / Team'
            ? teamName.trim()
            : (effectiveTeamId !== 'NO_TEAM_ID' ? `Team ${effectiveTeamId}` : (effectiveContactName ? `Query (${effectiveContactName})` : 'Participant'));
        const effectiveContactPhone = typeof contactPhone === 'string' ? contactPhone.trim() : '';
        const effectiveContactEmail = typeof contactEmail === 'string' ? contactEmail.trim().toLowerCase() : '';

        // Limit: max 5 open/accepted tickets per team
        if (effectiveTeamId !== 'NO_TEAM_ID' && effectiveTeamId !== 'GUEST') {
            const activeTickets = tickets.filter(t => t.teamId.toUpperCase() === effectiveTeamId.toUpperCase() && (t.status === 'open' || t.status === 'accepted'));
            if (activeTickets.length >= 5) {
                return NextResponse.json({ error: 'Your team already has active help requests. Coordinators will contact you shortly.' }, { status: 429 });
            }
        }

        const newTicket: HelpTicket = {
            id: `HT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            teamId: effectiveTeamId,
            teamName: effectiveTeamName,
            category,
            description: String(description).trim(),
            tableNumber: tableNumber ? String(tableNumber).trim() : '',
            contactName: effectiveContactName,
            contactPhone: effectiveContactPhone,
            contactEmail: effectiveContactEmail,
            source: source === 'edit_registration' ? 'edit_registration' : source === 'email' ? 'email' : 'dashboard',
            status: 'open',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        tickets.unshift(newTicket);
        await persistTickets(tickets);

        return NextResponse.json({
            success: true,
            ticket: newTicket,
            message: 'Your query has been logged! Our coordinators will contact you.'
        });
    } catch (error) {
        console.error('Failed to process help ticket:', error);
        return NextResponse.json({ error: 'Could not process help ticket.' }, { status: 500 });
    }
}
