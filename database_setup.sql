
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
    credentials_issued_at timestamptz,
    created_at timestamptz not null default now(),
    completed_at timestamptz
);

alter table registrations add column if not exists proposed_idea text;
alter table registrations add column if not exists tech_stack jsonb not null default '{}'::jsonb;
alter table registrations add column if not exists track_preferences jsonb not null default '[]'::jsonb;
alter table registrations add column if not exists member_meal_state jsonb not null default '{}'::jsonb;
alter table registrations add column if not exists meal_access jsonb not null default '{}'::jsonb;
alter table registrations add column if not exists password_hash text;
alter table registrations add column if not exists credentials_issued_at timestamptz;

create table if not exists judging_evaluations (
    id uuid primary key default gen_random_uuid(),
    team_id text not null references registrations(team_id) on update cascade on delete cascade,
    round_id text not null,
    round_title text not null,
    judge_id text not null,
    judge_name text not null,
    criteria_scores jsonb not null default '{}'::jsonb,
    total_score numeric(7, 2),
    feedback text not null default '',
    status text not null default 'in_progress' check (status in ('in_progress', 'submitted')),
    claim_expires_at timestamptz not null default (now() + interval '30 minutes'),
    started_at timestamptz not null default now(),
    draft_updated_at timestamptz not null default now(),
    submitted_at timestamptz,
    created_at timestamptz not null default now(),
    unique (team_id, round_id),
    unique (team_id, judge_id)
);

create index if not exists idx_judging_evaluations_round_status
    on judging_evaluations(round_id, status);

create index if not exists idx_judging_evaluations_judge
    on judging_evaluations(judge_id, status);

create table if not exists hackathon_settings (
    key text primary key,
    value jsonb not null,
    updated_at timestamptz not null default now()
);

create or replace function scan_volunteer_pass(
    p_team_id text,
    p_pass_type text,
    p_member_id text,
    p_volunteer_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_team registrations%rowtype;
    v_now timestamptz := now();
    v_members jsonb;
    v_member_key text;
    v_member_name text;
    v_member_slots jsonb;
    v_member_state jsonb;
    v_enabled_meals jsonb;
    v_meal_key text;
    v_slot jsonb;
    v_updated_slot jsonb;
    v_raw_data jsonb;
    v_scan_cooldown jsonb;
    v_last_scan timestamptz;
    v_has_assigned_meal boolean := false;
begin
    if p_pass_type not in ('leader', 'member', 'legacy') then
        return jsonb_build_object('status', 'INVALID_PASS');
    end if;

    select * into v_team
    from registrations
     where upper(team_id) = upper(trim(p_team_id))
         or upper(transaction_id) = upper(trim(p_team_id))
    for update;

    if not found then
        return jsonb_build_object('status', 'TEAM_NOT_FOUND');
    end if;

    if p_pass_type in ('leader', 'legacy') then
        if v_team.is_checked_in or coalesce(v_team.raw_data->>'checkedInAt', '') <> '' then
            return jsonb_build_object(
                'status', 'ALREADY_CHECKED_IN',
                'teamId', v_team.team_id,
                'teamName', v_team.team_name,
                'checkedInAt', coalesce(v_team.raw_data->>'checkedInAt', '')
            );
        end if;

        v_raw_data := coalesce(v_team.raw_data, '{}'::jsonb);
        v_raw_data := jsonb_set(v_raw_data, '{checkedInAt}', to_jsonb(v_now::text), true);
        update registrations
        set is_checked_in = true, raw_data = v_raw_data
        where team_id = v_team.team_id;

        return jsonb_build_object(
            'status', 'PERMITTED',
            'teamId', v_team.team_id,
            'teamName', v_team.team_name,
            'checkedInAt', v_now
        );
    end if;

    if not (v_team.is_checked_in or coalesce(v_team.raw_data->>'checkedInAt', '') <> '') then
        return jsonb_build_object(
            'status', 'NEEDS_CHECKIN',
            'teamId', v_team.team_id,
            'teamName', v_team.team_name
        );
    end if;

    v_members := case
        when jsonb_typeof(v_team.members) = 'array' then v_team.members
        else '[]'::jsonb
    end;
    select
        coalesce(nullif(trim(member.value->>'email'), ''), 'member_' || (member.ordinality - 1)::text),
        coalesce(nullif(trim(member.value->>'fullName'), ''), nullif(trim(member.value->>'name'), ''), 'Participant')
    into v_member_key, v_member_name
    from jsonb_array_elements(v_members) with ordinality as member(value, ordinality)
    where case
        when jsonb_typeof(member.value) = 'object' then
            lower(coalesce(nullif(trim(member.value->>'email'), ''), 'member_' || (member.ordinality - 1)::text)) = lower(trim(p_member_id))
        when jsonb_typeof(member.value) = 'string' then
            lower('member_' || (member.ordinality - 1)::text) = lower(trim(p_member_id))
        else false
    end
    limit 1;

    if v_member_key is null then
        return jsonb_build_object('status', 'MEMBER_NOT_FOUND', 'teamId', v_team.team_id, 'teamName', v_team.team_name);
    end if;

    select value into v_enabled_meals
    from hackathon_settings
    where key = 'enabled_meals';
    if jsonb_typeof(v_enabled_meals) <> 'array' or jsonb_array_length(v_enabled_meals) = 0 then
        return jsonb_build_object('status', 'NOT_INCLUDED', 'teamId', v_team.team_id, 'teamName', v_team.team_name);
    end if;

    v_raw_data := coalesce(v_team.raw_data, '{}'::jsonb);
    v_scan_cooldown := coalesce(v_raw_data->'mealScanCooldown', '{}'::jsonb);
    begin
        v_last_scan := (v_scan_cooldown->>v_member_key)::timestamptz;
    exception when others then
        v_last_scan := null;
    end;
    if v_last_scan is not null and v_now - v_last_scan < interval '5 seconds' then
        return jsonb_build_object('status', 'DUPLICATE_SCAN', 'teamId', v_team.team_id, 'teamName', v_team.team_name, 'memberName', v_member_name);
    end if;

    v_member_state := coalesce(v_team.member_meal_state, '{}'::jsonb);
    v_member_slots := coalesce(v_member_state->v_member_key, '{}'::jsonb);
    for v_meal_key in select jsonb_array_elements_text(v_enabled_meals)
    loop
        v_slot := v_member_slots->v_meal_key;
        if v_slot is not null then
            v_has_assigned_meal := true;
            if coalesce(v_slot->>'claimedAt', '') = '' then
                v_updated_slot := jsonb_set(v_slot, '{claimedAt}', to_jsonb(v_now::text), true);
                v_updated_slot := jsonb_set(v_updated_slot, '{claimedBy}', to_jsonb(coalesce(nullif(trim(p_volunteer_id), ''), 'Volunteer')), true);
                v_member_state := jsonb_set(v_member_state, array[v_member_key, v_meal_key], v_updated_slot, true);
                v_scan_cooldown := jsonb_set(v_scan_cooldown, array[v_member_key], to_jsonb(v_now::text), true);
                v_raw_data := jsonb_set(v_raw_data, '{mealScanCooldown}', v_scan_cooldown, true);

                update registrations
                set member_meal_state = v_member_state, raw_data = v_raw_data
                where team_id = v_team.team_id;

                return jsonb_build_object(
                    'status', 'PERMITTED',
                    'teamId', v_team.team_id,
                    'teamName', v_team.team_name,
                    'memberId', v_member_key,
                    'memberName', v_member_name,
                    'mealKey', v_meal_key,
                    'claimedAt', v_now,
                    'claimedBy', coalesce(nullif(trim(p_volunteer_id), ''), 'Volunteer')
                );
            end if;
        end if;
    end loop;

    if v_has_assigned_meal then
        return jsonb_build_object('status', 'ALL_MEALS_CLAIMED', 'teamId', v_team.team_id, 'teamName', v_team.team_name, 'memberName', v_member_name);
    end if;
    return jsonb_build_object('status', 'NOT_INCLUDED', 'teamId', v_team.team_id, 'teamName', v_team.team_name, 'memberName', v_member_name);
end;
$$;

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
    ('start_date', '"2026-10-10"'::jsonb),
    ('emergency_contact', '{"name":"Event Coordinator","phone":""}'::jsonb),
    ('is_submission_locked', 'false'::jsonb),
    ('is_round_lock_enabled', 'true'::jsonb),
    ('enabled_meals', '[]'::jsonb),
    ('released_rounds', '[]'::jsonb),
    ('round_configs', '[]'::jsonb),
    ('participant_edit_start', '"2026-10-04T18:30:00.000Z"'::jsonb),
    ('participant_edit_end', '"2026-10-06T18:30:00.000Z"'::jsonb),
    ('event_access_start', '"2026-10-09T18:30:00.000Z"'::jsonb),
    ('event_access_end', '"2026-10-11T18:30:00.000Z"'::jsonb)
on conflict (key) do nothing;

update hackathon_settings
set value = '"2026-10-10"'::jsonb, updated_at = now()
where key = 'start_date' and value = '"2026-02-27"'::jsonb;

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
language plpgsql
security definer
set search_path = public
as $$
declare
    candidate text;
begin
    loop
        candidate := 'TRICITY_' || nextval('registration_team_number_seq')::text;
        exit when not exists (select 1 from registrations where team_id = candidate);
    end loop;
    return candidate;
end;
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
alter table judging_evaluations enable row level security;

drop policy if exists "Public Select Registrations" on registrations;
drop policy if exists "Public Update Registrations" on registrations;
drop policy if exists "Public Insert Registrations" on registrations;
drop policy if exists "Public Select Settings" on hackathon_settings;
drop policy if exists "Public Update Settings" on hackathon_settings;
drop policy if exists "Public Insert Settings" on hackathon_settings;

revoke all on registrations, hackathon_settings, judges, volunteers, judging_evaluations from anon, authenticated;
grant all on registrations, hackathon_settings, judges, volunteers, judging_evaluations to service_role;
revoke all on function next_registration_team_id() from public, anon, authenticated;
grant execute on function next_registration_team_id() to service_role;
revoke all on function next_staff_id(text) from public, anon, authenticated;
grant execute on function next_staff_id(text) to service_role;
revoke all on function scan_volunteer_pass(text, text, text, text) from public, anon, authenticated;
grant execute on function scan_volunteer_pass(text, text, text, text) to service_role;

notify pgrst, 'reload schema';
