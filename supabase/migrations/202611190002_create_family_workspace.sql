-- Creates the first household and its owner profile in one transaction.

create or replace function public.create_family_workspace(
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
  clean_household_name text := trim(household_name);
  clean_owner_name text := trim(owner_display_name);
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if char_length(clean_household_name) not between 1 and 80
    or char_length(clean_owner_name) not between 1 and 80 then
    raise exception 'Invalid household or owner name';
  end if;

  if exists (
    select 1
    from public.household_members
    where user_id = current_user_id
  ) then
    raise exception 'User already belongs to a household';
  end if;

  insert into public.households (name, created_by)
  values (clean_household_name, current_user_id)
  returning id into new_household_id;

  insert into public.household_members (
    household_id,
    user_id,
    role,
    display_name
  ) values (
    new_household_id,
    current_user_id,
    'owner',
    clean_owner_name
  );

  insert into public.profiles (
    household_id,
    auth_user_id,
    name,
    initials,
    focus,
    theme
  ) values (
    new_household_id,
    current_user_id,
    clean_owner_name,
    upper(left(clean_owner_name, 1)),
    'Ruch, zdrowie i regularność',
    jsonb_build_object(
      'accent', '#ff7a2f',
      'accentSoft', '#3b281d',
      'background', 'linear-gradient(150deg, #0b2119 0%, #122b22 48%, #17231d 100%)'
    )
  );

  return new_household_id;
end;
$$;

revoke all on function public.create_family_workspace(text, text) from public;
grant execute on function public.create_family_workspace(text, text) to authenticated;
