
create extension if not exists "pgcrypto";

create table if not exists registrations (
    transaction_id text primary key default gen_random_uuid()::text,
    team_name text not null,
    team_id text unique,
    password_hash text,
    track text,
    problem_statement text,
    proposed_idea text,
    tech_stack jsonb not null default '{}'::jsonb,
    track_preferences jsonb not null default '[]'::jsonb,
    college text,
    captain text,
    captain_mobile text,
    email text,
    entry_type text,
    members jsonb not null default '[]'::jsonb,
    status text not null default 'PENDING',
    github_url text,
    presentation_url text,
    demo_url text,
    deployment_url text,
    is_final_submission boolean not null default false,
    round_scores jsonb not null default '{}'::jsonb,
    round_comments jsonb not null default '{}'::jsonb,
    round_detailed_scores jsonb not null default '{}'::jsonb,
    is_eliminated boolean not null default false,
    is_checked_in boolean not null default false,
    member_meal_state jsonb not null default '{}'::jsonb,
    meal_access jsonb not null default '{}'::jsonb,
    room text,
    volunteer_name text,
    volunteer_phone text,
    room_wifi_ssid text,
    room_wifi_pass text,
    assigned_judge text,
    raw_data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    completed_at timestamptz
);

alter table registrations add column if not exists proposed_idea text;
alter table registrations add column if not exists tech_stack jsonb not null default '{}'::jsonb;
alter table registrations add column if not exists track_preferences jsonb not null default '[]'::jsonb;
alter table registrations add column if not exists member_meal_state jsonb not null default '{}'::jsonb;
alter table registrations add column if not exists meal_access jsonb not null default '{}'::jsonb;
alter table registrations add column if not exists password_hash text;

create table if not exists hackathon_settings (
    key text primary key,
    value jsonb not null,
    updated_at timestamptz not null default now()
);

create table if not exists judges (
    id text primary key default gen_random_uuid()::text,
    generated_id text unique,
    name text not null,
    password_hash text,
    specialization text,
    created_at timestamptz not null default now()
);

create table if not exists volunteers (
    id text primary key default gen_random_uuid()::text,
    generated_id text unique,
    name text not null,
    password_hash text,
    phone text,
    role text,
    created_at timestamptz not null default now()
);

alter table judges add column if not exists password_hash text;
alter table volunteers add column if not exists password_hash text;

do $$
begin
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'registrations' and column_name = 'password') then
        execute 'update public.registrations set password_hash = crypt(password, gen_salt(''bf'', 12)) where password is not null and password <> '''' and (password_hash is null or password_hash = '''')';
        execute 'alter table public.registrations drop column password';
    end if;
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'judges' and column_name = 'password') then
        execute 'update public.judges set password_hash = crypt(password, gen_salt(''bf'', 12)) where password is not null and password <> '''' and (password_hash is null or password_hash = '''')';
        execute 'alter table public.judges drop column password';
    end if;
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'volunteers' and column_name = 'password') then
        execute 'update public.volunteers set password_hash = crypt(password, gen_salt(''bf'', 12)) where password is not null and password <> '''' and (password_hash is null or password_hash = '''')';
        execute 'alter table public.volunteers drop column password';
    end if;
end;
$$;

insert into hackathon_settings (key, value) values
    ('start_date', '"2026-02-27"'::jsonb),
    ('emergency_contact', '{"name":"Event Coordinator","phone":""}'::jsonb),
    ('is_submission_locked', 'false'::jsonb),
    ('is_round_lock_enabled', 'true'::jsonb),
    ('enabled_meals', '[]'::jsonb),
    ('released_rounds', '[]'::jsonb),
    ('round_configs', '[]'::jsonb)
on conflict (key) do nothing;

create index if not exists idx_registrations_team_id on registrations(team_id);
create index if not exists idx_registrations_status on registrations(status);
create index if not exists idx_registrations_created_at on registrations(created_at desc);

create sequence if not exists registration_team_number_seq start with 101;
select setval(
    'registration_team_number_seq',
    greatest(100, coalesce(max(substring(team_id from '([0-9]+)$')::bigint), 100)),
    true
)
from registrations;

create or replace function next_registration_team_id()
returns text
language sql
security definer
set search_path = public
as $$
    select 'TRICITY_' || nextval('registration_team_number_seq')::text;
$$;

create sequence if not exists judge_id_seq start with 101;
create sequence if not exists volunteer_id_seq start with 101;
select setval(
    'judge_id_seq',
    greatest(100, coalesce(max(substring(generated_id from '([0-9]+)$')::bigint), 100)),
    true
)
from judges;
select setval(
    'volunteer_id_seq',
    greatest(100, coalesce(max(substring(generated_id from '([0-9]+)$')::bigint), 100)),
    true
)
from volunteers;

create or replace function next_staff_id(staff_type text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
    candidate text;
begin
    if staff_type = 'judge' then
        loop
            candidate := 'TRJ-' || nextval('judge_id_seq')::text;
            exit when not exists (select 1 from judges where generated_id = candidate);
        end loop;
    elsif staff_type = 'volunteer' then
        loop
            candidate := 'TRV-' || nextval('volunteer_id_seq')::text;
            exit when not exists (select 1 from volunteers where generated_id = candidate);
        end loop;
    else
        raise exception 'Unsupported staff type';
    end if;
    return candidate;
end;
$$;

alter table registrations enable row level security;
alter table hackathon_settings enable row level security;
alter table judges enable row level security;
alter table volunteers enable row level security;

drop policy if exists "Public Select Registrations" on registrations;
drop policy if exists "Public Update Registrations" on registrations;
drop policy if exists "Public Insert Registrations" on registrations;
drop policy if exists "Public Select Settings" on hackathon_settings;
drop policy if exists "Public Update Settings" on hackathon_settings;
drop policy if exists "Public Insert Settings" on hackathon_settings;

revoke all on registrations, hackathon_settings, judges, volunteers from anon, authenticated;
grant all on registrations, hackathon_settings, judges, volunteers to service_role;
revoke all on function next_registration_team_id() from public, anon, authenticated;
grant execute on function next_registration_team_id() to service_role;
revoke all on function next_staff_id(text) from public, anon, authenticated;
grant execute on function next_staff_id(text) to service_role;
