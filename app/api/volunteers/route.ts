import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('volunteers')
            .select('*');

        if (error) {
            console.error('❌ Volunteers Fetch Error:', error);
            // Don't error out if table doesn't exist yet, return empty
            return NextResponse.json([]);
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('❌ Volunteers API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { name, role, generated_id, password, phone } = await req.json();

        if (!name || !generated_id || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('volunteers')
            .upsert({
                name,
                role,
                generated_id,
                password,
                phone
            })
            .select()
            .single();

        if (error) {
            console.error('❌ Error creating volunteer:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('❌ Volunteer Creation Error:', error);
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

        // Try deleting by generated_id first (VHV-XXX)
        let { error, count } = await supabase
            .from('volunteers')
            .delete()
            .eq('generated_id', id);

        // If no rows deleted, try by UUID
        if (!error && (count === 0 || count === null)) {
            const res = await supabase
                .from('volunteers')
                .delete()
                .eq('id', id);
            error = res.error;
        }

        if (error) {
            console.error('❌ Error deleting volunteer:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('❌ Volunteer Deletion Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
