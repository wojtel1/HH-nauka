begin;

-- The application loads one household per account.
create unique index household_members_one_household_per_user
  on public.household_members (user_id);

create table public.family_invitations (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  email text not null,
  token_hash bytea not null unique,
  expires_at timestamptz not null
);

alter table public.family_invitations enable row level security;
revoke all on table public.family_invitations from public, anon, authenticated;

create function public.create_family_invitation(target_profile uuid, invited_email text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  invite_code uuid := pg_catalog.gen_random_uuid();
  clean_email text := lower(trim(invited_email));
begin
  if clean_email is null or length(clean_email) > 254
    or clean_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then
    raise exception 'Invalid email';
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id = target_profile and p.auth_user_id is null
      and public.is_household_owner(p.household_id)
  ) then
    raise exception 'Profile unavailable';
  end if;

  insert into public.family_invitations (profile_id, email, token_hash, expires_at)
  values (
    target_profile, clean_email,
    pg_catalog.sha256(pg_catalog.convert_to(invite_code::text, 'UTF8')),
    now() + interval '48 hours'
  )
  on conflict (profile_id) do update
    set email = excluded.email, token_hash = excluded.token_hash, expires_at = excluded.expires_at;

  return invite_code;
end;
$$;

create function public.accept_family_invitation(invite_code uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  account_id uuid := auth.uid();
  invitation_profile uuid;
  target_household uuid;
  profile_name text;
begin
  select i.profile_id into invitation_profile
  from public.family_invitations i
  join auth.users u on u.id = account_id and lower(u.email) = i.email
  where u.email_confirmed_at is not null
    and i.token_hash = pg_catalog.sha256(pg_catalog.convert_to(invite_code::text, 'UTF8'))
    and i.expires_at > clock_timestamp()
  for update of i;

  if invitation_profile is null
    or exists (select 1 from public.household_members where user_id = account_id) then
    return false;
  end if;

  update public.profiles set auth_user_id = account_id
  where id = invitation_profile and auth_user_id is null
  returning household_id, name into target_household, profile_name;

  if target_household is null then
    return false;
  end if;

  insert into public.household_members (household_id, user_id, role, display_name)
  values (target_household, account_id, 'member', profile_name);

  delete from public.family_invitations where profile_id = invitation_profile;
  return true;
exception
  when unique_violation then return false;
end;
$$;

revoke all on function public.create_family_invitation(uuid, text) from public, anon, authenticated;
revoke all on function public.accept_family_invitation(uuid) from public, anon, authenticated;
grant execute on function public.create_family_invitation(uuid, text) to authenticated;
grant execute on function public.accept_family_invitation(uuid) to authenticated;

commit;
