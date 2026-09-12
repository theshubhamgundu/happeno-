
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: registrations (Teams/Projects)
-- This table stores all team data, including members, submissions, and detailed scoring.
-- It matches the schema used by the Judge Dashboard and API routes.
create table if not exists registrations (
    transaction_id text primary key default uuid_generate_v4()::text,
    team_name text not null,
    team_id text unique, -- e.g., HB26-V9GA
    password text,
    track text,
    problem_statement text,
    college text,
    captain text, -- Captain Name
    captain_mobile text,
    email text,
    entry_type text, -- 'INDIVIDUAL', 'DUO', 'SQUAD'
    members jsonb default '[]'::jsonb, -- Array of member objects or strings
    status text default 'PENDING',
    
    -- Submission Links
    github_url text,
    presentation_url text,
    demo_url text,
    deployment_url text,
    is_final_submission boolean default false,

    -- Judging & Scoring
    round_scores jsonb default '{}'::jsonb, -- { "round1": 8.5 }
    round_comments jsonb default '{}'::jsonb, -- { "round1": "Good job" }
    round_detailed_scores jsonb default '{}'::jsonb, -- { "round1": { "r1q1": 9, ... } }
    is_eliminated boolean default false,
    is_checked_in boolean default false,

    -- Logistics
    room text,
    volunteer_name text,
    volunteer_phone text,
    room_wifi_ssid text,
    room_wifi_pass text,
    assigned_judge text,
    raw_data jsonb default '{}'::jsonb, -- Store full registration payload for backup

    created_at timestamptz default now(),
    completed_at timestamptz
);

-- Table: hackathon_settings (Global Config)
-- Stores dynamic configuration accessed by Judge and Admin dashboards.
-- Matches 'app/api/settings/route.ts'
create table if not exists hackathon_settings (
    key text primary key,
    value jsonb not null,
    updated_at timestamptz default now()
);

-- Insert Default Settings (if they don't exist)
insert into hackathon_settings (key, value) values 
('start_date', '"2026-02-27"'::jsonb),
('emergency_contact', '{"name": "Organizer", "phone": "+91 0000000000"}'::jsonb),
('wifi_details', '{"ssid": "HackBytes_Guest", "pass": "secureWiFi"}'::jsonb),
('released_rounds', '[]'::jsonb),
('is_submission_locked', 'false'::jsonb)
on conflict (key) do nothing;

-- Table: judges (Optional - For Future Auth Integration)
create table if not exists judges (
    id text primary key default uuid_generate_v4()::text,
    generated_id text unique, -- e.g., VHJ-101
    name text not null,
    password text not null,
    specialization text,
    created_at timestamptz default now()
);

-- Table: volunteers (Optional - For Future Auth Integration)
create table if not exists volunteers (
    id text primary key default uuid_generate_v4()::text,
    generated_id text unique, -- e.g., VHV-101
    name text not null,
    phone text,
    role text,
    password text not null,
    created_at timestamptz default now()
);

-- RLS Policies (Optional - Basic Security)
-- Enabling RLS is recommended for production.
alter table registrations enable row level security;
alter table hackathon_settings enable row level security;

-- Allow public access for this hackathon context (Simplified for development)
create policy "Public Select Registrations" on registrations for select using (true);
create policy "Public Update Registrations" on registrations for update using (true);
create policy "Public Insert Registrations" on registrations for insert with check (true);

create policy "Public Select Settings" on hackathon_settings for select using (true);
create policy "Public Update Settings" on hackathon_settings for update using (true);
create policy "Public Insert Settings" on hackathon_settings for insert with check (true);

-- Indexes for performance
create index if not exists idx_registrations_team_id on registrations(team_id);
create index if not exists idx_registrations_status on registrations(status);
