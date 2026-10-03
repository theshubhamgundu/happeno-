import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function openJudging() {
    console.log("Opening judging portals in database...");

    const settingsToUpdate = [
        { key: "is_round_lock_enabled", value: false },
        { key: "judging_override", value: "open" },
        { key: "event_access_start", value: "2020-01-01T00:00:00Z" },
        { key: "event_access_end", value: "2030-01-01T00:00:00Z" }
    ];

    for (const setting of settingsToUpdate) {
        const { error } = await supabase
            .from("hackathon_settings")
            .upsert({ key: setting.key, value: setting.value }, { onConflict: 'key' });
        
        if (error) {
            console.error(`Failed to update ${setting.key}:`, error.message);
        } else {
            console.log(`✅ Set ${setting.key} = ${setting.value}`);
        }
    }

    console.log("\nJudging should now be fully open for all rounds!");
}

openJudging();
