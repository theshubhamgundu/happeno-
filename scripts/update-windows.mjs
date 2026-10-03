import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
    process.exit(1);
}

const supabase = createClient(url, serviceRoleKey);

async function updateWindows() {
    console.log("Updating timeframe windows in hackathon_settings...");

    const settings = [
        { key: "participant_edit_start", value: "2026-10-05T10:00:00+05:30" },
        { key: "participant_edit_end", value: "2026-10-06T22:00:00+05:30" },
        { key: "event_access_start", value: "2026-10-10T00:00:00+05:30" },
        { key: "event_access_end", value: "2026-10-11T23:59:59+05:30" }
    ];

    for (const setting of settings) {
        const { error } = await supabase
            .from("hackathon_settings")
            .upsert({ key: setting.key, value: setting.value }, { onConflict: 'key' });

        if (error) {
            console.error(`Failed to update ${setting.key}:`, error.message);
        } else {
            console.log(`✅ Set ${setting.key} = ${setting.value}`);
        }
    }
}

updateWindows();
