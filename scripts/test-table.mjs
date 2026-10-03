import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, serviceRoleKey);

async function testTable() {
    const { data, error } = await supabase.from("judging_evaluations").select("id").limit(1);
    if (error) {
        console.error("Query failed:", error.message);
    } else {
        console.log("Table judging_evaluations exists. Data:", data);
    }
}
testTable();
