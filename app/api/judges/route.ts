import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('judges')
            .select('*');

        if (error) {
            console.error('❌ Judges Fetch Error:', error);
            // Don't error out if table doesn't exist yet, return empty
            return NextResponse.json([]);
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('❌ Judges API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { name, specialization, generated_id, password } = await req.json();

        if (!name || !generated_id || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('judges')
            .upsert({
                name,
                specialization,
                generated_id,
                password
            })
            .select()
            .single();

        if (error) {
            console.error('❌ Error creating judge:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('❌ Judge Creation Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        // Try deleting by generated_id first (VHJ-XXX)
        let { error, count } = await supabase
            .from('judges')
            .delete()
            .eq('generated_id', id);

        // If no rows deleted, try by UUID
        if (!error && (count === 0 || count === null)) {
            const res = await supabase
                .from('judges')
                .delete()
                .eq('id', id);
            error = res.error;
        }

        if (error) {
            console.error('❌ Error deleting judge:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('❌ Judge Deletion Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
