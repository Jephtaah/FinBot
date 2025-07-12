-- migration: simple and robust signup fix
-- purpose: create a bulletproof signup flow that handles all edge cases
-- affected tables: profiles (trigger function, schema verification)
-- approach: start fresh with minimal dependencies

-- ensure we have the user_role enum (defensive)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('user', 'admin');
  end if;
end;
$$;

-- ensure profiles table has all required columns
do $$
begin
  -- add role column if missing
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'role'
  ) then
    alter table public.profiles add column role user_role default 'user' not null;
  end if;
  
  -- add created_at if missing
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'created_at'
  ) then
    alter table public.profiles add column created_at timestamptz default now() not null;
  end if;
  
  -- add updated_at if missing
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'updated_at'
  ) then
    alter table public.profiles add column updated_at timestamptz default now() not null;
  end if;
end;
$$;

-- create the simplest possible trigger function that works
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- simple insert with minimal complexity
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing; -- avoid duplicate key errors
  
  return new;
exception
  when others then
    -- log error but don't fail signup
    raise warning 'Profile creation failed for %: %', new.id, sqlerrm;
    return new; -- continue with signup even if profile creation fails
end;
$$;

-- ensure trigger exists
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- create a separate function to populate missing profile data after signup
create or replace function public.complete_user_profile(
  user_full_name text default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- update the current user's profile with additional data
  update public.profiles 
  set 
    full_name = coalesce(user_full_name, full_name),
    role = coalesce(role, 'user'::user_role),
    updated_at = now()
  where id = auth.uid();
end;
$$;

-- grant permissions
grant execute on function public.handle_new_user() to service_role;
grant execute on function public.complete_user_profile(text) to authenticated;

comment on function public.handle_new_user() is 'Minimal auth trigger for profile creation';
comment on function public.complete_user_profile(text) is 'Complete profile data after successful signup';