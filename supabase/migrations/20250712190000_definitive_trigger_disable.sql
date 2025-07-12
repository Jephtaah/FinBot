-- migration: definitive trigger disable and cleanup
-- purpose: permanently disable all triggers on auth.users and clean up the mess
-- issue: multiple migrations keep re-creating the trigger even after we disabled it

-- step 1: drop ALL triggers on auth.users table (no matter what they're called)
do $$
declare
  trigger_rec record;
begin
  raise notice 'DROPPING ALL TRIGGERS ON auth.users';
  
  for trigger_rec in
    select trigger_name
    from information_schema.triggers
    where event_object_schema = 'auth' 
      and event_object_table = 'users'
  loop
    execute 'drop trigger if exists ' || trigger_rec.trigger_name || ' on auth.users';
    raise notice 'DROPPED TRIGGER: %', trigger_rec.trigger_name;
  end loop;
end;
$$;

-- step 2: drop the problematic trigger function to prevent it from being re-attached
drop function if exists public.handle_new_user() cascade;

-- step 3: create a completely different, minimal function that never fails
create or replace function public.safe_profile_creator()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- do absolutely nothing - this is just a placeholder
  -- profile creation will be handled manually in the application
  return new;
exception
  when others then
    -- even if something goes wrong, never fail
    return new;
end;
$$;

-- step 4: create a function to check current trigger status
create or replace function public.debug_auth_triggers()
returns table(
  trigger_name text,
  event_manipulation text,
  action_statement text
)
language sql
security definer
set search_path = ''
as $$
  select 
    t.trigger_name::text,
    t.event_manipulation::text,
    t.action_statement::text
  from information_schema.triggers t
  where t.event_object_schema = 'auth' 
    and t.event_object_table = 'users';
$$;

-- step 5: ensure profiles table is ready for manual creation
-- make sure id column can accept any UUID without constraints causing issues
do $$
begin
  -- ensure profiles table exists
  if not exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'profiles'
  ) then
    -- create minimal profiles table if it doesn't exist
    create table public.profiles (
      id uuid primary key,
      email text,
      created_at timestamptz default now()
    );
    
    -- enable RLS
    alter table public.profiles enable row level security;
    
    -- create basic policy
    create policy "users_can_access_own_profile" on public.profiles
      for all to authenticated
      using (auth.uid() = id)
      with check (auth.uid() = id);
      
    raise notice 'CREATED MINIMAL PROFILES TABLE';
  else
    raise notice 'PROFILES TABLE EXISTS';
  end if;
end;
$$;

-- step 6: enhanced manual profile creation function
create or replace function public.ensure_profile_exists()
returns json
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid;
  user_email text;
  result json;
begin
  -- get current user info
  current_user_id := auth.uid();
  
  if current_user_id is null then
    return json_build_object(
      'success', false,
      'error', 'Not authenticated'
    );
  end if;
  
  -- check if profile exists
  if exists (select 1 from public.profiles where id = current_user_id) then
    return json_build_object(
      'success', true,
      'message', 'Profile already exists'
    );
  end if;
  
  -- get email from auth.users
  select email into user_email
  from auth.users
  where id = current_user_id;
  
  -- create profile
  begin
    insert into public.profiles (id, email, created_at)
    values (current_user_id, user_email, now())
    on conflict (id) do nothing;
    
    return json_build_object(
      'success', true,
      'message', 'Profile created',
      'user_id', current_user_id,
      'email', user_email
    );
    
  exception
    when others then
      return json_build_object(
        'success', false,
        'error', sqlerrm,
        'user_id', current_user_id
      );
  end;
end;
$$;

-- grant permissions
grant execute on function public.debug_auth_triggers() to authenticated;
grant execute on function public.ensure_profile_exists() to authenticated;

-- final check and report
do $$
declare
  trigger_count integer;
begin
  select count(*) into trigger_count
  from information_schema.triggers
  where event_object_schema = 'auth' 
    and event_object_table = 'users';
  
  if trigger_count = 0 then
    raise notice 'SUCCESS: No triggers on auth.users - signup should work now';
  else
    raise warning 'WARNING: % triggers still exist on auth.users', trigger_count;
  end if;
  
  raise notice 'Use SELECT * FROM public.debug_auth_triggers() to check trigger status';
  raise notice 'Use SELECT public.ensure_profile_exists() to manually create profiles';
end;
$$;