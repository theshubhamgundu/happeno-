import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        // Fallback to local file system if Supabase is not configured
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            const judgesPath = path.join(process.cwd(), 'data', 'judges.json');
            
            if (fs.existsSync(judgesPath)) {
                const localJudges = JSON.parse(fs.readFileSync(judgesPath, 'utf8'));
                return NextResponse.json(localJudges);
            } else {
                // Create default judges file if it doesn't exist
                const defaultJudges: any[] = [];
                
                // Ensure data directory exists
                const dataDir = path.join(process.cwd(), 'data');
                if (!fs.existsSync(dataDir)) {
                    fs.mkdirSync(dataDir, { recursive: true });
                }
                
                fs.writeFileSync(judgesPath, JSON.stringify(defaultJudges, null, 2));
                return NextResponse.json(defaultJudges);
            }
        }

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

        // Fallback to local file system if Supabase is not configured
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            const judgesPath = path.join(process.cwd(), 'data', 'judges.json');
            
            let judges = [];
            if (fs.existsSync(judgesPath)) {
                judges = JSON.parse(fs.readFileSync(judgesPath, 'utf8'));
            }
            
            const newJudge = {
                id: generated_id,
                name,
                specialization,
                generated_id,
                password,
                created_at: new Date().toISOString()
            };
            
            judges.push(newJudge);
            
            // Ensure data directory exists
            const dataDir = path.join(process.cwd(), 'data');
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            fs.writeFileSync(judgesPath, JSON.stringify(judges, null, 2));
            return NextResponse.json({ success: true, data: newJudge });
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

        // Fallback to local file system if Supabase is not configured
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            const judgesPath = path.join(process.cwd(), 'data', 'judges.json');
            
            let judges = [];
            if (fs.existsSync(judgesPath)) {
                judges = JSON.parse(fs.readFileSync(judgesPath, 'utf8'));
            }
            
            // Filter out the judge by id or generated_id
            const filteredJudges = judges.filter((judge: any) => 
                judge.id !== id && judge.generated_id !== id
            );
            
            fs.writeFileSync(judgesPath, JSON.stringify(filteredJudges, null, 2));
            return NextResponse.json({ success: true });
        }

        // Try deleting by generated_id first (TRJ-XXX)
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
