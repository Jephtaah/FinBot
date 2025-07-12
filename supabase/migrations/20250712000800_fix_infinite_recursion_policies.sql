-- migration: fix infinite recursion in RLS policies
-- purpose: remove circular dependencies in admin policies
-- affected tables: profiles, transactions, receipt_images

-- drop all existing policies that might cause recursion
drop policy if exists "users can view their own profile" on public.profiles;
drop policy if exists "users can create their own profile" on public.profiles;
drop policy if exists "users can update their own profile" on public.profiles;
drop policy if exists "users can delete their own profile" on public.profiles;
drop policy if exists "admins can view all profiles" on public.profiles;
drop policy if exists "admins can update all profiles" on public.profiles;
drop policy if exists "admins can delete all profiles" on public.profiles;

-- create simple, non-recursive policies for profiles
-- users can always view their own profile
create policy "users can view their own profile" 
on public.profiles 
for select 
to authenticated 
using ( auth.uid() = id );

-- users can create their own profile  
create policy "users can create their own profile" 
on public.profiles 
for insert 
to authenticated 
with check ( auth.uid() = id );

-- users can update their own profile
create policy "users can update their own profile" 
on public.profiles 
for update 
to authenticated 
using ( auth.uid() = id )
with check ( auth.uid() = id );

-- users can delete their own profile
create policy "users can delete their own profile" 
on public.profiles 
for delete 
to authenticated 
using ( auth.uid() = id );

-- create a function to safely check if user is admin without recursion
create or replace function public.auth_user_is_admin()
returns boolean
language sql
security definer -- this runs with elevated privileges
stable
as $$
  select exists (
    select 1 from public.profiles 
    where id = auth.uid() and role = 'admin'
  );
$$;

-- grant execute permission to authenticated users
grant execute on function public.auth_user_is_admin() to authenticated;

-- now create admin policies using the function
create policy "admin can view all profiles" 
on public.profiles 
for select 
to authenticated 
using ( public.auth_user_is_admin() );

create policy "admin can update all profiles" 
on public.profiles 
for update 
to authenticated 
using ( public.auth_user_is_admin() )
with check ( public.auth_user_is_admin() );

create policy "admin can delete all profiles" 
on public.profiles 
for delete 
to authenticated 
using ( public.auth_user_is_admin() );

-- fix similar issues in transactions table
drop policy if exists "admins can view all transactions" on public.transactions;
drop policy if exists "admins can update all transactions" on public.transactions;
drop policy if exists "admins can delete all transactions" on public.transactions;
drop policy if exists "admins can create any transactions" on public.transactions;

-- recreate transaction admin policies with the safe function
create policy "admin can view all transactions" 
on public.transactions 
for select 
to authenticated 
using ( public.auth_user_is_admin() );

create policy "admin can update all transactions" 
on public.transactions 
for update 
to authenticated 
using ( public.auth_user_is_admin() )
with check ( public.auth_user_is_admin() );

create policy "admin can delete all transactions" 
on public.transactions 
for delete 
to authenticated 
using ( public.auth_user_is_admin() );

create policy "admin can create any transactions" 
on public.transactions 
for insert 
to authenticated 
with check ( public.auth_user_is_admin() );

-- fix similar issues in receipt_images table
drop policy if exists "admins can view all receipt images" on public.receipt_images;
drop policy if exists "admins can update all receipt images" on public.receipt_images;
drop policy if exists "admins can delete all receipt images" on public.receipt_images;
drop policy if exists "admins can create any receipt images" on public.receipt_images;

-- recreate receipt_images admin policies with the safe function
create policy "admin can view all receipt images" 
on public.receipt_images 
for select 
to authenticated 
using ( public.auth_user_is_admin() );

create policy "admin can update all receipt images" 
on public.receipt_images 
for update 
to authenticated 
using ( public.auth_user_is_admin() )
with check ( public.auth_user_is_admin() );

create policy "admin can delete all receipt images" 
on public.receipt_images 
for delete 
to authenticated 
using ( public.auth_user_is_admin() );

create policy "admin can create any receipt images" 
on public.receipt_images 
for insert 
to authenticated 
with check ( public.auth_user_is_admin() );

-- add comment explaining the solution
comment on function public.auth_user_is_admin() is 'Safely checks if current user is admin without causing RLS recursion. Uses security definer to bypass RLS when checking role.';