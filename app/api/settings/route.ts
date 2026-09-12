import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('hackathon_settings')
            .select('*');

        if (error) {
            console.error('❌ Settings Fetch Error:', error);
            // If table doesn't exist yet, return empty but don't crash
            return NextResponse.json({});
        }

        // Convert key-value rows to a single object
        const settings = (data || []).reduce((acc: any, item: any) => {
            acc[item.key] = item.value;
            return acc;
        }, {});

        return NextResponse.json(settings);
    } catch (error) {
        console.error('❌ Settings API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { key, value } = await req.json();

        if (!key) {
            return NextResponse.json({ error: 'Key is required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('hackathon_settings')
            .upsert({ key, value, updated_at: new Date().toISOString() });

        if (error) {
            console.error(`❌ Error updating setting ${key}:`, error);
            return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('❌ Settings Update Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
