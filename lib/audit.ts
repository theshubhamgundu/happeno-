import { supabase } from './supabase';

export async function logAdminAction(adminId: string, adminName: string, actionType: string, details: string) {
    try {
        const { error } = await supabase.from('admin_audit_logs').insert({
            admin_id: adminId,
            admin_name: adminName,
            action_type: actionType,
            details: details
        });
        if (error) {
            console.error('Audit Log Error:', error);
        }
    } catch (err) {
        console.error('Failed to write audit log:', err);
    }
}
