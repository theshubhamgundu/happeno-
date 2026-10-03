import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, serviceRoleKey);

const COST_FACTOR = 12;

function getRandom4Digits() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

async function resetPasswords() {
    const admins = [
        { username: "shubham", pass: "Shubham@1911" },
        { username: "karthik", pass: `Karthik@${getRandom4Digits()}` },
        { username: "vamshi", pass: `Vamshi@${getRandom4Digits()}` },
        { username: "sai", pass: `Sai@${getRandom4Digits()}` }
    ];

    console.log("Setting new format passwords...\n");
    for (const admin of admins) {
        const password_hash = await bcrypt.hash(admin.pass, COST_FACTOR);
        const { error } = await supabase
            .from("admins")
            .update({ password_hash })
            .eq("username", admin.username);
        
        if (error) {
            console.error(`Failed for ${admin.username}:`, error.message);
        } else {
            console.log(`✅ ${admin.username} -> password: ${admin.pass}`);
        }
    }
}

resetPasswords();
