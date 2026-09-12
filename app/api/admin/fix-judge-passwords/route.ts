import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Updates all existing judges in the database so their password follows
 * the new format: {numericId}@tricity
 * e.g. VHJ-101 â†’ password becomes "101@tricity"
 */
export async function POST() {
    try {
        // Fetch all judges
        const { data: judges, error: fetchError } = await supabase
            .from('judges')
            .select('id, generated_id, password');

        if (fetchError) {
            return NextResponse.json({ error: 'Failed to fetch judges', details: fetchError.message }, { status: 500 });
        }

        if (!judges || judges.length === 0) {
            return NextResponse.json({ success: true, updated: 0, message: 'No judges found' });
        }

        let updatedCount = 0;
        const errors: string[] = [];
        const updates: { id: string; generated_id: string; newPassword: string }[] = [];

        for (const judge of judges) {
            if (!judge.generated_id) continue;

            // Extract numeric part from generated_id like "VHJ-101"
            const parts = judge.generated_id.split('-');
            const numericId = parseInt(parts[parts.length - 1]);
            if (isNaN(numericId)) continue;

            const newPassword = `${numericId}@tricity`;

            // Skip if password is already in correct format
            if (judge.password === newPassword) {
                updatedCount++;
                continue;
            }

            updates.push({ id: judge.id, generated_id: judge.generated_id, newPassword });
        }

        // Apply updates
        for (const update of updates) {
            const { error: updateError } = await supabase
                .from('judges')
                .update({ password: update.newPassword })
                .eq('id', update.id);

            if (updateError) {
                errors.push(`Failed for ${update.generated_id}: ${updateError.message}`);
            } else {
                updatedCount++;
            }
        }

        return NextResponse.json({
            success: true,
            updated: updatedCount,
            errors: errors.length > 0 ? errors : undefined,
            message: `Successfully updated passwords for ${updatedCount} judges.`
        });

    } catch (error: any) {
        console.error('âŒ Fix judge passwords error:', error);
        return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
    }
}
