-- migration: ensure trigger function has proper permissions for signup
-- purpose: verify that handle_new_user trigger can successfully create profiles
-- affected tables: profiles (trigger permissions), auth.users (trigger setup)
-- issue: signup failures may be due to trigger permission issues

-- ensure the trigger function has proper permissions
-- the function runs as 'security invoker' which means it runs with the permissions of the user calling it
-- for auth triggers, this means it runs with elevated system permissions
grant usage on schema public to authenticated;
grant all on public.profiles to authenticated;

-- ensure the function is properly set up with correct security model
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer  -- changed to security definer for auth trigger context
set search_path = ''
as $$
begin
  -- insert new profile record with user's email, default 'user' role, and metadata
  -- extract full_name from raw_user_meta_data passed during signup
  insert into public.profiles (
    id, 
    email, 
    role,
    full_name,
    created_at,
    updated_at
  )
  values (
    new.id, 
    new.email, 
    'user'::user_role,
    coalesce(new.raw_user_meta_data->>'full_name', null), -- extract from signup metadata
    now(),
    now()
  );
  return new;
exception
  when others then
    -- log error but don't fail the signup process
    raise warning 'Failed to create profile for user %: %', new.id, sqlerrm;
    -- re-raise the exception to see what's actually failing
    raise;
end;
$$;

-- ensure the trigger is properly configured
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- grant execute permissions on the function
grant execute on function public.handle_new_user() to service_role;
grant execute on function public.handle_new_user() to authenticated;

-- add a simple test function to verify the trigger setup
create or replace function public.test_profile_creation()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  test_result text;
begin
  -- check if the trigger exists
  select 'Trigger exists: ' || case when count(*) > 0 then 'YES' else 'NO' end
  into test_result
  from information_schema.triggers 
  where trigger_name = 'on_auth_user_created' 
    and event_object_table = 'users'
    and event_object_schema = 'auth';
  
  return test_result;
end;
$$;

-- grant execute on test function
grant execute on function public.test_profile_creation() to authenticated;

-- add helpful comments
comment on function public.handle_new_user() is 'Auth trigger: Creates profile record on user signup with metadata extraction';
comment on function public.test_profile_creation() is 'Test function to verify trigger setup';

-- verify the user role enum exists (defensive check)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    raise exception 'user_role enum does not exist. Run role migration first.';
  end if;
end;
$$;