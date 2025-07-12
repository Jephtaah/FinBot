-- migration: cleanup duplicate and conflicting RLS policies
-- purpose: resolve policy conflicts that could interfere with user signup
-- affected tables: profiles (rls policy cleanup)
-- issue: multiple migrations created duplicate policies causing potential conflicts

-- drop all existing policies to start fresh
drop policy if exists "users can view their own profile" on public.profiles;
drop policy if exists "users can create their own profile" on public.profiles;
drop policy if exists "users can update their own profile" on public.profiles;
drop policy if exists "users can delete their own profile" on public.profiles;
drop policy if exists "authenticated_users_can_view_own_profile" on public.profiles;
drop policy if exists "authenticated_users_can_create_own_profile" on public.profiles;
drop policy if exists "authenticated_users_can_update_own_profile" on public.profiles;
drop policy if exists "authenticated_users_can_delete_own_profile" on public.profiles;

-- drop admin policies
drop policy if exists "admins can view all profiles" on public.profiles;
drop policy if exists "admins can update all profiles" on public.profiles;
drop policy if exists "admins can delete all profiles" on public.profiles;
drop policy if exists "admins can create any profiles" on public.profiles;
drop policy if exists "admin can view all profiles" on public.profiles;
drop policy if exists "admin can update all profiles" on public.profiles;
drop policy if exists "admin can delete all profiles" on public.profiles;

-- drop service role policies (if any)
drop policy if exists "service role can insert profiles" on public.profiles;

-- recreate clean user policies with clear, non-conflicting names
-- users can view their own profile
create policy "profile_select_own" 
on public.profiles 
for select 
to authenticated 
using ( auth.uid() = id );

-- users can create their own profile (needed for signup trigger)
create policy "profile_insert_own" 
on public.profiles 
for insert 
to authenticated 
with check ( auth.uid() = id );

-- users can update their own profile
create policy "profile_update_own" 
on public.profiles 
for update 
to authenticated 
using ( auth.uid() = id )
with check ( auth.uid() = id );

-- users can delete their own profile
create policy "profile_delete_own" 
on public.profiles 
for delete 
to authenticated 
using ( auth.uid() = id );

-- recreate admin policies with clean names
-- admin can view all profiles
create policy "profile_select_admin" 
on public.profiles 
for select 
to authenticated 
using ( 
  exists (
    select 1 from public.profiles 
    where id = auth.uid() and role = 'admin'
  )
);

-- admin can update all profiles
create policy "profile_update_admin" 
on public.profiles 
for update 
to authenticated 
using ( 
  exists (
    select 1 from public.profiles 
    where id = auth.uid() and role = 'admin'
  )
)
with check ( 
  exists (
    select 1 from public.profiles 
    where id = auth.uid() and role = 'admin'
  )
);

-- admin can delete all profiles
create policy "profile_delete_admin" 
on public.profiles 
for delete 
to authenticated 
using ( 
  exists (
    select 1 from public.profiles 
    where id = auth.uid() and role = 'admin'
  )
);

-- admin can insert profiles for any user (if needed)
create policy "profile_insert_admin" 
on public.profiles 
for insert 
to authenticated 
with check ( 
  exists (
    select 1 from public.profiles 
    where id = auth.uid() and role = 'admin'
  )
);

-- add helpful comments
comment on policy "profile_select_own" on public.profiles is 'Users can view their own profile';
comment on policy "profile_insert_own" on public.profiles is 'Users can create their own profile (needed for signup)';
comment on policy "profile_update_own" on public.profiles is 'Users can update their own profile';
comment on policy "profile_delete_own" on public.profiles is 'Users can delete their own profile';
comment on policy "profile_select_admin" on public.profiles is 'Admins can view all profiles';
comment on policy "profile_update_admin" on public.profiles is 'Admins can update all profiles';
comment on policy "profile_delete_admin" on public.profiles is 'Admins can delete all profiles';
comment on policy "profile_insert_admin" on public.profiles is 'Admins can create profiles for any user';

-- verify RLS is enabled
alter table public.profiles enable row level security;