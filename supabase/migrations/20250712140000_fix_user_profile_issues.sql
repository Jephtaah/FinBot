-- migration: fix user profile creation and rls policy issues
-- purpose: resolve new user signup and profile editing problems
-- affected tables: profiles (rls policies, trigger function)
-- rls: fix policy conflicts and ensure proper user access

-- drop existing conflicting policies that may interfere with user access
drop policy if exists "users can view their own profile" on public.profiles;
drop policy if exists "users can create their own profile" on public.profiles;
drop policy if exists "users can update their own profile" on public.profiles;
drop policy if exists "users can delete their own profile" on public.profiles;

-- recreate user policies with clearer, non-conflicting names
-- policy for users to view their own profile
create policy "authenticated_users_can_view_own_profile" 
on public.profiles 
for select 
to authenticated 
using ( auth.uid() = id );

-- policy for users to create their own profile (needed for signup)
create policy "authenticated_users_can_create_own_profile" 
on public.profiles 
for insert 
to authenticated 
with check ( auth.uid() = id );

-- policy for users to update their own profile
create policy "authenticated_users_can_update_own_profile" 
on public.profiles 
for update 
to authenticated 
using ( auth.uid() = id )
with check ( auth.uid() = id );

-- policy for users to delete their own profile
create policy "authenticated_users_can_delete_own_profile" 
on public.profiles 
for delete 
to authenticated 
using ( auth.uid() = id );

-- fix the handle_new_user function to include all necessary fields
-- this ensures new users get a complete profile record
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- insert new profile record with user's email and default 'user' role
  -- include all necessary fields for a complete profile
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
    null, -- full_name will be set during onboarding
    now(),
    now()
  );
  return new;
exception
  when others then
    -- log error but don't fail the signup process
    raise warning 'Failed to create profile for user %: %', new.id, sqlerrm;
    return new;
end;
$$;

-- ensure the trigger exists and is properly configured
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- add a function to check if a user's profile exists and create it if missing
-- this helps with any users who signed up before this fix
create or replace function public.ensure_user_profile()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- only run if user is authenticated
  if auth.uid() is null then
    return;
  end if;

  -- check if profile exists, create if missing
  insert into public.profiles (
    id, 
    email, 
    role,
    full_name,
    created_at,
    updated_at
  )
  select 
    auth.uid(),
    (select email from auth.users where id = auth.uid()),
    'user'::user_role,
    null,
    now(),
    now()
  where not exists (
    select 1 from public.profiles where id = auth.uid()
  );
end;
$$;

-- create an index to ensure email lookups are efficient
create index if not exists profiles_user_id_idx on public.profiles (id);

-- add helpful comments
comment on function public.handle_new_user() is 'Automatically creates a profile record when a new user signs up via auth.users';
comment on function public.ensure_user_profile() is 'Ensures the current authenticated user has a profile record, creates one if missing';

-- grant necessary permissions
grant execute on function public.ensure_user_profile() to authenticated;