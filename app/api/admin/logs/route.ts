import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const session = getSession(req);
    
    // Security check: Only allow 'shubham' to view the logs
    if (!session || session.role !== 'admin' || session.name?.toLowerCase() !== 'shubham') {
        return NextResponse.json({ success: false, error: 'Unauthorized: Only Shubham can view audit logs.' }, { status: 403 });
    }

    try {
        const { data, error } = await supabase
            .from('admin_audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);
            
        if (error) throw error;
        
        return NextResponse.json({ success: true, logs: data || [] });
    } catch (err: any) {
        console.error('Failed to fetch audit logs:', err);
        return NextResponse.json({ success: false, error: 'Failed to fetch logs' }, { status: 500 });
    }
}
