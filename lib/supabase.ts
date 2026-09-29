import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | undefined;

function getSupabase(): SupabaseClient {
    if (supabaseInstance) return supabaseInstance;

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
        throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    }

    supabaseInstance = createClient(url, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
    return supabaseInstance;
}

export const supabase = new Proxy({} as SupabaseClient, {
    get(_target, property) {
        const client = getSupabase();
        const value = Reflect.get(client, property);
        return typeof value === "function" ? value.bind(client) : value;
    }
});

export const teamSupabase = supabase;
