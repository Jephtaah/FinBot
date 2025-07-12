-- migration: backfill missing profiles for existing users
-- purpose: ensure all existing auth.users have corresponding profile records
-- affected tables: profiles (data backfill)
-- rls: uses existing policies

-- backfill profiles for any auth.users who don't have a profile record
-- this handles cases where users signed up before profile creation was working
insert into public.profiles (
  id, 
  email, 
  role,
  full_name,
  created_at,
  updated_at
)
select 
  au.id,
  au.email,
  'user'::user_role,
  null, -- full_name will be set during profile editing
  au.created_at,
  au.updated_at
from auth.users au
left join public.profiles p on au.id = p.id
where p.id is null -- only insert for users without profiles
  and au.email is not null; -- ensure we have an email

-- add a comment explaining this migration
comment on table public.profiles is 'User profiles with extended information. Each auth.users record should have a corresponding profile record.';

-- verify the backfill worked by checking for any remaining orphaned users
-- this is just for verification, not an actual migration step
do $$
declare
  orphaned_count integer;
begin
  select count(*) into orphaned_count
  from auth.users au
  left join public.profiles p on au.id = p.id
  where p.id is null;
  
  if orphaned_count > 0 then
    raise warning 'Found % auth.users without profiles after backfill', orphaned_count;
  else
    raise notice 'All auth.users now have corresponding profiles';
  end if;
end;
$$;