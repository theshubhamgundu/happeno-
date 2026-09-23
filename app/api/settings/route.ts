import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

// Cache responses at the edge for 60 seconds to prevent DB spikes
export const revalidate = 60;

export async function GET() {
    try {
        // Fallback to local file system if Supabase is not configured
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            const settingsPath = path.join(process.cwd(), 'data', 'settings.json');
            
            if (fs.existsSync(settingsPath)) {
                const localSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
                return NextResponse.json(localSettings);
            } else {
                // Create default settings file if it doesn't exist
                const defaultSettings = {
                    start_date: "2026-02-27",
                    emergency_contact: { name: "Event Coordinator", phone: "+1-555-0123" },
                    wifi_details: { ssid: "EventWiFi", pass: "password123" },
                    wifi_networks: [],
                    rooms: [],
                    is_submission_locked: false,
                    is_round_lock_enabled: true,
                    is_certificates_enabled: false,
                    enabled_meals: ["day1_breakfast", "day1_lunch", "day1_dinner", "day2_breakfast", "day2_lunch"],
                    released_rounds: [],
                    round_configs: []
                };
                
                // Ensure data directory exists
                const dataDir = path.join(process.cwd(), 'data');
                if (!fs.existsSync(dataDir)) {
                    fs.mkdirSync(dataDir, { recursive: true });
                }
                
                fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
                return NextResponse.json(defaultSettings);
            }
        }

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

        // Fallback to local file system if Supabase is not configured
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            const settingsPath = path.join(process.cwd(), 'data', 'settings.json');
            
            let settings = {};
            if (fs.existsSync(settingsPath)) {
                settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            }
            
            // Update the setting
            (settings as any)[key] = value;
            
            // Ensure data directory exists
            const dataDir = path.join(process.cwd(), 'data');
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
            return NextResponse.json({ success: true });
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
