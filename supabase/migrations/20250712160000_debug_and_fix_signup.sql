-- migration: debug and fix signup issues comprehensively
-- purpose: diagnose and resolve "Database error saving new user" issues
-- affected tables: profiles (schema fixes, trigger debugging)
-- issue: comprehensive debugging and fixing of signup flow

-- first, let's check what's currently in the profiles table
do $$
begin
  raise notice 'Profiles table columns:';
  for rec in 
    select column_name, data_type, is_nullable, column_default
    from information_schema.columns 
    where table_schema = 'public' and table_name = 'profiles'
    order by ordinal_position
  loop
    raise notice '  %: % (nullable: %, default: %)', rec.column_name, rec.data_type, rec.is_nullable, rec.column_default;
  end loop;
end;
$$;

-- check if user_role enum exists
do $$
begin
  if exists (select 1 from pg_type where typname = 'user_role') then
    raise notice 'user_role enum exists';
  else
    raise notice 'user_role enum MISSING - creating it';
    create type user_role as enum ('user', 'admin');
  end if;
end;
$$;

-- ensure role column exists with proper type and default
do $$
begin
  -- add role column if it doesn't exist
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
      and table_name = 'profiles' 
      and column_name = 'role'
  ) then
    raise notice 'Adding role column to profiles table';
    alter table public.profiles add column role user_role default 'user' not null;
  else
    raise notice 'Role column already exists';
  end if;
  
  -- ensure all existing profiles have a role
  update public.profiles set role = 'user'::user_role where role is null;
end;
$$;

-- create a simplified, robust trigger function
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer  -- run with elevated permissions for auth trigger
set search_path = ''
as $$
declare
  profile_full_name text;
begin
  -- safely extract full_name from metadata
  profile_full_name := coalesce(new.raw_user_meta_data->>'full_name', null);
  
  raise notice 'Creating profile for user % with email % and name %', new.id, new.email, profile_full_name;
  
  -- insert new profile record
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
    profile_full_name,
    now(),
    now()
  );
  
  raise notice 'Successfully created profile for user %', new.id;
  return new;
  
exception
  when others then
    -- log detailed error information
    raise warning 'Failed to create profile for user %: % (SQLSTATE: %)', 
      new.id, sqlerrm, sqlstate;
    raise warning 'User data: id=%, email=%, metadata=%', 
      new.id, new.email, new.raw_user_meta_data;
    
    -- re-raise the exception so we can see what's actually failing
    raise;
end;
$$;

-- ensure the trigger is properly set up
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- grant necessary permissions
grant usage on schema public to authenticated;
grant all privileges on public.profiles to authenticated;
grant execute on function public.handle_new_user() to service_role;
grant execute on function public.handle_new_user() to authenticated;

-- create a test function to manually test profile creation
create or replace function public.test_signup_flow(
  test_email text default 'test@example.com',
  test_name text default 'Test User'
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  test_id uuid;
  result json;
begin
  -- generate a test user id
  test_id := gen_random_uuid();
  
  raise notice 'Testing profile creation for user % with email % and name %', 
    test_id, test_email, test_name;
  
  -- try to create a profile directly (simulating what the trigger does)
  begin
    insert into public.profiles (
      id, 
      email, 
      role,
      full_name,
      created_at,
      updated_at
    )
    values (
      test_id, 
      test_email, 
      'user'::user_role,
      test_name,
      now(),
      now()
    );
    
    -- clean up test data
    delete from public.profiles where id = test_id;
    
    result := json_build_object(
      'success', true,
      'message', 'Profile creation test successful',
      'test_id', test_id
    );
    
  exception
    when others then
      result := json_build_object(
        'success', false,
        'error', sqlerrm,
        'sqlstate', sqlstate,
        'test_id', test_id
      );
  end;
  
  return result;
end;
$$;

-- grant execute on test function
grant execute on function public.test_signup_flow(text, text) to authenticated;

-- add helpful comments
comment on function public.handle_new_user() is 'Auth trigger: Creates profile with comprehensive error logging';
comment on function public.test_signup_flow(text, text) is 'Test function to debug profile creation issues';

-- final verification
do $$
declare
  trigger_count integer;
begin
  select count(*) into trigger_count
  from information_schema.triggers 
  where trigger_name = 'on_auth_user_created' 
    and event_object_table = 'users'
    and event_object_schema = 'auth';
  
  if trigger_count > 0 then
    raise notice 'SUCCESS: Trigger is properly configured';
  else
    raise warning 'WARNING: Trigger is not properly configured';
  end if;
end;
$$;