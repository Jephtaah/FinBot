-- migration: fix potential RLS policy conflicts
-- purpose: ensure user and admin policies work together correctly
-- affected tables: profiles, transactions, receipt_images

-- temporarily disable rls to fix any issues
set session_replication_role = replica;

-- re-enable rls
set session_replication_role = default;

-- ensure profiles table policies work correctly
-- drop and recreate the basic user policies to ensure they work with the new role column

-- drop existing user policies for profiles if they exist
drop policy if exists "users can view their own profile" on public.profiles;
drop policy if exists "users can create their own profile" on public.profiles;
drop policy if exists "users can update their own profile" on public.profiles;
drop policy if exists "users can delete their own profile" on public.profiles;

-- recreate user policies for profiles
create policy "users can view their own profile" 
on public.profiles 
for select 
to authenticated 
using ( (select auth.uid()) = id );

create policy "users can create their own profile" 
on public.profiles 
for insert 
to authenticated 
with check ( (select auth.uid()) = id );

create policy "users can update their own profile" 
on public.profiles 
for update 
to authenticated 
using ( (select auth.uid()) = id )
with check ( (select auth.uid()) = id );

create policy "users can delete their own profile" 
on public.profiles 
for delete 
to authenticated 
using ( (select auth.uid()) = id );

-- ensure the admin policies have proper priority by recreating them
drop policy if exists "admins can view all profiles" on public.profiles;
drop policy if exists "admins can update all profiles" on public.profiles;
drop policy if exists "admins can delete all profiles" on public.profiles;

-- recreate admin policies with explicit priority
create policy "admins can view all profiles" 
on public.profiles 
for select 
to authenticated 
using ( 
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

create policy "admins can update all profiles" 
on public.profiles 
for update 
to authenticated 
using ( 
  (select role from public.profiles where id = auth.uid()) = 'admin'
)
with check ( 
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

create policy "admins can delete all profiles" 
on public.profiles 
for delete 
to authenticated 
using ( 
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- add helpful comments
comment on table public.profiles is 'User profiles with role-based access control. Users can access their own data, admins can access all data.';