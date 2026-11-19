-- TrailVelo Family: initial cloud schema.
-- Apply with the Supabase CLI or paste into the Supabase SQL editor.

create extension if not exists pgcrypto;

create type public.household_role as enum ('owner', 'adult', 'member');
create type public.program_status as enum ('draft', 'active', 'completed', 'abandoned');
create type public.training_status as enum ('planned', 'completed', 'skipped', 'cancelled');

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.household_role not null default 'member',
  display_name text not null check (char_length(display_name) between 1 and 80),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create index household_members_user_id_idx
  on public.household_members (user_id);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,
  name text not null check (char_length(name) between 1 and 80),
  initials text not null check (char_length(initials) between 1 and 4),
  focus text not null default '',
  theme jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, auth_user_id)
);

create index profiles_household_id_idx on public.profiles (household_id);

create table public.training_programs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  goal text not null default '',
  source text not null default 'manual',
  weeks smallint not null check (weeks between 1 and 104),
  sessions_per_week smallint not null check (sessions_per_week between 1 and 14),
  current_week smallint not null default 1 check (current_week >= 1),
  progress_percent smallint not null default 0 check (progress_percent between 0 and 100),
  status public.program_status not null default 'draft',
  started_at timestamptz,
  ended_at timestamptz,
  end_reason text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ended_program_has_date check (
    (status in ('completed', 'abandoned') and ended_at is not null)
    or (status in ('draft', 'active') and ended_at is null)
  )
);

create unique index one_active_program_per_profile_idx
  on public.training_programs (profile_id)
  where status = 'active';
create index training_programs_profile_id_idx
  on public.training_programs (profile_id);

create table public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  program_id uuid references public.training_programs(id) on delete set null,
  scheduled_for date not null,
  title text not null check (char_length(title) between 1 and 160),
  subtitle text,
  kind text not null,
  environment text check (environment in ('indoor', 'outdoor')),
  intensity text not null check (intensity in ('easy', 'moderate', 'hard')),
  duration_minutes smallint not null check (duration_minutes between 1 and 1440),
  status public.training_status not null default 'planned',
  source text not null default 'manual',
  metrics jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index training_sessions_profile_date_idx
  on public.training_sessions (profile_id, scheduled_for);
create index training_sessions_program_id_idx
  on public.training_sessions (program_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger households_set_updated_at
before update on public.households
for each row execute function public.set_updated_at();
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();
create trigger training_programs_set_updated_at
before update on public.training_programs
for each row execute function public.set_updated_at();
create trigger training_sessions_set_updated_at
before update on public.training_sessions
for each row execute function public.set_updated_at();

create or replace function public.is_household_member(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_members
    where household_id = target_household_id
      and user_id = (select auth.uid())
  );
$$;

create or replace function public.is_household_owner(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_members
    where household_id = target_household_id
      and user_id = (select auth.uid())
      and role = 'owner'
  );
$$;

revoke all on function public.is_household_member(uuid) from public;
revoke all on function public.is_household_owner(uuid) from public;
grant execute on function public.is_household_member(uuid) to authenticated;
grant execute on function public.is_household_owner(uuid) to authenticated;

create or replace function public.create_household_with_owner(
  household_name text,
  owner_display_name text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_household_id uuid;
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if char_length(trim(household_name)) not between 1 and 80
    or char_length(trim(owner_display_name)) not between 1 and 80 then
    raise exception 'Invalid household or owner name';
  end if;

  insert into public.households (name, created_by)
  values (trim(household_name), current_user_id)
  returning id into new_household_id;

  insert into public.household_members (household_id, user_id, role, display_name)
  values (new_household_id, current_user_id, 'owner', trim(owner_display_name));

  return new_household_id;
end;
$$;

revoke all on function public.create_household_with_owner(text, text) from public;
grant execute on function public.create_household_with_owner(text, text) to authenticated;

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.profiles enable row level security;
alter table public.training_programs enable row level security;
alter table public.training_sessions enable row level security;

revoke all on table public.households from anon, authenticated;
revoke all on table public.household_members from anon, authenticated;
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.training_programs from anon, authenticated;
revoke all on table public.training_sessions from anon, authenticated;

grant select, update, delete on table public.households to authenticated;
grant select, insert, update, delete on table public.household_members to authenticated;
grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.training_programs to authenticated;
grant select, insert, update, delete on table public.training_sessions to authenticated;

create policy households_select_members
on public.households for select to authenticated
using (public.is_household_member(id));
create policy households_update_owners
on public.households for update to authenticated
using (public.is_household_owner(id))
with check (public.is_household_owner(id));
create policy households_delete_owners
on public.households for delete to authenticated
using (public.is_household_owner(id));

create policy household_members_select_members
on public.household_members for select to authenticated
using (public.is_household_member(household_id));
create policy household_members_insert_owners
on public.household_members for insert to authenticated
with check (public.is_household_owner(household_id));
create policy household_members_update_owners
on public.household_members for update to authenticated
using (public.is_household_owner(household_id))
with check (public.is_household_owner(household_id));
create policy household_members_delete_owners
on public.household_members for delete to authenticated
using (public.is_household_owner(household_id));

create policy profiles_select_members
on public.profiles for select to authenticated
using (public.is_household_member(household_id));
create policy profiles_insert_members
on public.profiles for insert to authenticated
with check (public.is_household_member(household_id));
create policy profiles_update_members
on public.profiles for update to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));
create policy profiles_delete_owners
on public.profiles for delete to authenticated
using (public.is_household_owner(household_id));

create policy training_programs_select_members
on public.training_programs for select to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = training_programs.profile_id
      and public.is_household_member(profiles.household_id)
  )
);
create policy training_programs_insert_members
on public.training_programs for insert to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.profiles
    where profiles.id = training_programs.profile_id
      and public.is_household_member(profiles.household_id)
  )
);
create policy training_programs_update_members
on public.training_programs for update to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = training_programs.profile_id
      and public.is_household_member(profiles.household_id)
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = training_programs.profile_id
      and public.is_household_member(profiles.household_id)
  )
);
create policy training_programs_delete_members
on public.training_programs for delete to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = training_programs.profile_id
      and public.is_household_member(profiles.household_id)
  )
);

create policy training_sessions_select_members
on public.training_sessions for select to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = training_sessions.profile_id
      and public.is_household_member(profiles.household_id)
  )
);
create policy training_sessions_insert_members
on public.training_sessions for insert to authenticated
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = training_sessions.profile_id
      and public.is_household_member(profiles.household_id)
  )
);
create policy training_sessions_update_members
on public.training_sessions for update to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = training_sessions.profile_id
      and public.is_household_member(profiles.household_id)
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = training_sessions.profile_id
      and public.is_household_member(profiles.household_id)
  )
);
create policy training_sessions_delete_members
on public.training_sessions for delete to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = training_sessions.profile_id
      and public.is_household_member(profiles.household_id)
  )
);
