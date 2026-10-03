import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import fs from "fs";

// Using explicit .env.local parsing or running with node --env-file=.env.local
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

const judgesToCreate = [
    { generated_id: "TCJ-101", name: "Dr. Alan Turing", specialization: "AI/ML" },
    { generated_id: "TCJ-102", name: "Ada Lovelace", specialization: "Web Dev" },
    { generated_id: "TCJ-103", name: "Grace Hopper", specialization: "Cloud & DevSecOps" }
];

async function seedJudges() {
    console.log("Seeding judges to Supabase...");
    
    for (const judge of judgesToCreate) {
        // Generate a random 8-character password
        const password = randomBytes(6).toString("base64url");
        const password_hash = await hashPassword(password);
        
        const { data, error } = await supabase
            .from("judges")
            .insert({
                name: judge.name,
                generated_id: judge.generated_id,
                specialization: judge.specialization,
                password_hash: password_hash
            })
            .select("generated_id, name")
            .single();

        if (error) {
            console.error(`Error inserting ${judge.generated_id}:`, error.message);
        } else {
            console.log(`✅ Created Judge: ${data.name}`);
            console.log(`   ID: ${data.generated_id}`);
            console.log(`   Password: ${password}`);
            console.log(`   -- Please save this password! --\n`);
        }
    }
    console.log("Done!");
}

seedJudges();
