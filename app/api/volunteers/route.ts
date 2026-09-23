import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        // Fallback to local file system if Supabase is not configured
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            const volunteersPath = path.join(process.cwd(), 'data', 'volunteers.json');
            
            if (fs.existsSync(volunteersPath)) {
                const localVolunteers = JSON.parse(fs.readFileSync(volunteersPath, 'utf8'));
                return NextResponse.json(localVolunteers);
            } else {
                // Create default volunteers file if it doesn't exist
                const defaultVolunteers: any[] = [];
                
                // Ensure data directory exists
                const dataDir = path.join(process.cwd(), 'data');
                if (!fs.existsSync(dataDir)) {
                    fs.mkdirSync(dataDir, { recursive: true });
                }
                
                fs.writeFileSync(volunteersPath, JSON.stringify(defaultVolunteers, null, 2));
                return NextResponse.json(defaultVolunteers);
            }
        }

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

        // Fallback to local file system if Supabase is not configured
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            const volunteersPath = path.join(process.cwd(), 'data', 'volunteers.json');
            
            let volunteers = [];
            if (fs.existsSync(volunteersPath)) {
                volunteers = JSON.parse(fs.readFileSync(volunteersPath, 'utf8'));
            }
            
            const newVolunteer = {
                id: generated_id,
                name,
                role,
                generated_id,
                password,
                phone,
                created_at: new Date().toISOString()
            };
            
            volunteers.push(newVolunteer);
            
            // Ensure data directory exists
            const dataDir = path.join(process.cwd(), 'data');
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            fs.writeFileSync(volunteersPath, JSON.stringify(volunteers, null, 2));
            return NextResponse.json({ success: true, data: newVolunteer });
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

        // Fallback to local file system if Supabase is not configured
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            const volunteersPath = path.join(process.cwd(), 'data', 'volunteers.json');
            
            let volunteers = [];
            if (fs.existsSync(volunteersPath)) {
                volunteers = JSON.parse(fs.readFileSync(volunteersPath, 'utf8'));
            }
            
            // Filter out the volunteer by id or generated_id
            const filteredVolunteers = volunteers.filter((volunteer: any) => 
                volunteer.id !== id && volunteer.generated_id !== id
            );
            
            fs.writeFileSync(volunteersPath, JSON.stringify(filteredVolunteers, null, 2));
            return NextResponse.json({ success: true });
        }

        // Try deleting by generated_id first (TRV-XXX)
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
