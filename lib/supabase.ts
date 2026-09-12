import { createClient } from '@supabase/supabase-js';

let supabaseInstance: any = null;

const getSupabase = () => {
    if (supabaseInstance) return supabaseInstance;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        const environment = typeof window === 'undefined' ? 'Server' : 'Client';
        console.error(`❌ [${environment}] Supabase Credentials Missing!`, {
            hasUrl: !!url,
            hasKey: !!key,
            nodeEnv: process.env.NODE_ENV,
            urlPreview: url ? `${url.substring(0, 10)}...` : 'none'
        });

        // Build-time protection: return a dummy object if missing
        const dummy: any = {
            from: () => dummy,
            select: () => dummy,
            order: () => dummy,
            limit: () => dummy,
            eq: () => dummy,
            or: () => dummy,
            single: () => Promise.resolve({ data: null, error: { message: "Credentials missing", code: "MISSING_CONFIG" } }),
            upsert: () => Promise.resolve({ data: null, error: { message: "Credentials missing", code: "MISSING_CONFIG" } }),
            update: () => dummy,
            delete: () => dummy,
            insert: () => Promise.resolve({ data: null, error: { message: "Credentials missing", code: "MISSING_CONFIG" } }),
            then: (resolve: any) => resolve({ data: [], error: { message: "Supabase credentials missing", code: "MISSING_CONFIG" } })
        };
        return dummy;
    }

    supabaseInstance = createClient(url, key);
    return supabaseInstance;
};

let teamSupabaseInstance: any = null;

const getTeamSupabase = () => {
    if (teamSupabaseInstance) return teamSupabaseInstance;

    // Use the specific keys provided by the user for the team project
    const url = process.env.NEXT_PUBLIC_TEAM_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_TEAM_SUPABASE_ANON_KEY;

    if (!url || !key) return getSupabase();

    teamSupabaseInstance = createClient(url, key);
    return teamSupabaseInstance;
};

export const supabase = new Proxy({} as any, {
    get: (target, prop) => {
        const inst = getSupabase();
        const val = inst[prop];
        if (typeof val === 'function') return val.bind(inst);
        return val;
    }
});

export const teamSupabase = new Proxy({} as any, {
    get: (target, prop) => {
        const inst = getTeamSupabase();
        const val = inst[prop];
        if (typeof val === 'function') return val.bind(inst);
        return val;
    }
});
