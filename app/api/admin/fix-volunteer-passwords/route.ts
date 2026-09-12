import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Updates all existing volunteers in the database so their password follows
 * the format: {numericId}@tricity
 * e.g. VHV-101 â†’ password becomes "101@tricity"
 */
export async function POST() {
    try {
        const { data: volunteers, error: fetchError } = await supabase
            .from('volunteers')
            .select('id, generated_id, password');

        if (fetchError) {
            return NextResponse.json({ error: 'Failed to fetch volunteers', details: fetchError.message }, { status: 500 });
        }

        if (!volunteers || volunteers.length === 0) {
            return NextResponse.json({ success: true, updated: 0, message: 'No volunteers found' });
        }

        let updatedCount = 0;
        const errors: string[] = [];

        for (const vol of volunteers) {
            if (!vol.generated_id) continue;

            // Extract numeric part from generated_id like "VHV-101"
            const parts = vol.generated_id.split('-');
            const numericId = parseInt(parts[parts.length - 1]);
            if (isNaN(numericId)) continue;

            const newPassword = `${numericId}@tricity`;

            if (vol.password === newPassword) {
                updatedCount++;
                continue;
            }

            const { error: updateError } = await supabase
                .from('volunteers')
                .update({ password: newPassword })
                .eq('id', vol.id);

            if (updateError) {
                errors.push(`Failed for ${vol.generated_id}: ${updateError.message}`);
            } else {
                updatedCount++;
            }
        }

        return NextResponse.json({
            success: true,
            updated: updatedCount,
            errors: errors.length > 0 ? errors : undefined,
            message: `Successfully updated passwords for ${updatedCount} volunteers.`
        });

    } catch (error: any) {
        console.error('âŒ Fix volunteer passwords error:', error);
        return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
    }
}
