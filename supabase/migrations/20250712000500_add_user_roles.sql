-- migration: add user roles system
-- purpose: add role-based access control with admin and user roles
-- affected tables: profiles (add role column)
-- rls: create admin policies for full data access

-- create user role enum
create type user_role as enum ('user', 'admin');

-- add role column to profiles table with default 'user' role
alter table public.profiles 
add column role user_role default 'user' not null;

-- update existing users to have 'user' role (redundant but explicit)
update public.profiles set role = 'user' where role is null;

-- update the handle_new_user function to set default role
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- insert new profile record with user's email and default 'user' role
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user');
  return new;
end;
$$;

-- create admin policies for profiles table
-- admin can view all profiles
create policy "admins can view all profiles" 
on public.profiles 
for select 
to authenticated 
using ( 
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- admin can update all profiles
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

-- admin can delete all profiles
create policy "admins can delete all profiles" 
on public.profiles 
for delete 
to authenticated 
using ( 
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- create admin policies for transactions table
-- admin can view all transactions
create policy "admins can view all transactions" 
on public.transactions 
for select 
to authenticated 
using ( 
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- admin can update all transactions
create policy "admins can update all transactions" 
on public.transactions 
for update 
to authenticated 
using ( 
  (select role from public.profiles where id = auth.uid()) = 'admin'
)
with check ( 
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- admin can delete all transactions
create policy "admins can delete all transactions" 
on public.transactions 
for delete 
to authenticated 
using ( 
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- admin can insert transactions for any user (if needed)
create policy "admins can create any transactions" 
on public.transactions 
for insert 
to authenticated 
with check ( 
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- create admin policies for receipt_images table
-- admin can view all receipt images
create policy "admins can view all receipt images" 
on public.receipt_images 
for select 
to authenticated 
using ( 
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- admin can update all receipt images
create policy "admins can update all receipt images" 
on public.receipt_images 
for update 
to authenticated 
using ( 
  (select role from public.profiles where id = auth.uid()) = 'admin'
)
with check ( 
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- admin can delete all receipt images
create policy "admins can delete all receipt images" 
on public.receipt_images 
for delete 
to authenticated 
using ( 
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- admin can insert receipt images for any user (if needed)
create policy "admins can create any receipt images" 
on public.receipt_images 
for insert 
to authenticated 
with check ( 
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- create helper function to check if user is admin
create or replace function public.is_admin()
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles 
    where id = auth.uid() and role = 'admin'
  );
$$;

-- create helper function to get user role
create or replace function public.get_user_role()
returns user_role
language sql
security invoker
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- add index on role column for better performance
create index if not exists profiles_role_idx on public.profiles (role);

-- add comment explaining the role system
comment on column public.profiles.role is 'User role: user (default) or admin (full access)';
comment on type user_role is 'Enum for user roles: user (default), admin (full access)';
comment on function public.is_admin() is 'Helper function to check if current user is admin';
comment on function public.get_user_role() is 'Helper function to get current user role';