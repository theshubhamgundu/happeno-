import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
    process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const COST_FACTOR = 12;
async function hashPassword(password) {
    return bcrypt.hash(password, COST_FACTOR);
}

async function setupAdmins() {
    console.log("Creating Admins Table and Audit Logs Table in Supabase...");

    // We can execute SQL by creating a dummy table creation or using Supabase's REST for upserts. 
    // Wait, the Supabase REST API can't execute raw DDL to create tables. 
    // We should output the SQL needed for the user to run in their Supabase Dashboard.
    const sql = `
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    authorized_device_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
    admin_name TEXT,
    action_type TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
    `;
    
    console.log("\n==================================================");
    console.log("PLEASE RUN THIS SQL IN YOUR SUPABASE SQL EDITOR:");
    console.log("==================================================\n");
    console.log(sql);
    console.log("==================================================\n");

    console.log("After running the SQL, run this script again with --seed flag to generate passwords for the 4 admins.");
}

async function seedAdmins() {
    const adminNames = ["SHUBHAM", "KARTHIK", "VAMSHI", "SAI KRISHNA"];
    console.log("\nSeeding 4 Admins into the database...\n");

    for (const name of adminNames) {
        const username = name.split(" ")[0].toLowerCase();
        const password = randomBytes(6).toString("base64url");
        const password_hash = await hashPassword(password);
        
        const { error } = await supabase
            .from("admins")
            .upsert({
                username: username,
                name: name,
                password_hash: password_hash
            }, { onConflict: 'username' });

        if (error) {
            console.error(`Failed to insert ${name}:`, error.message);
        } else {
            console.log(`✅ Admin Created: ${name}`);
            console.log(`   Username: ${username}`);
            console.log(`   Password: ${password}\n`);
        }
    }
}

if (process.argv.includes("--seed")) {
    seedAdmins();
} else {
    setupAdmins();
}
