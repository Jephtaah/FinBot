-- migration: create profiles table with extended user data
-- purpose: store user onboarding data and account details
-- affected tables: profiles (new), auth.users (trigger)
-- rls: enabled with user-specific access control

-- create profiles table to store extended user information
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  monthly_income numeric(10,2),  -- allows for precise financial calculations
  monthly_expense numeric(10,2), -- allows for precise financial calculations  
  savings_goal numeric(10,2),    -- allows for precise financial calculations
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- enable row level security on profiles table
alter table public.profiles enable row level security;

-- create rls policy for authenticated users to select their own profile
create policy "users can view their own profile" 
on public.profiles 
for select 
to authenticated 
using ( (select auth.uid()) = id );

-- create rls policy for authenticated users to insert their own profile
create policy "users can create their own profile" 
on public.profiles 
for insert 
to authenticated 
with check ( (select auth.uid()) = id );

-- create rls policy for authenticated users to update their own profile
create policy "users can update their own profile" 
on public.profiles 
for update 
to authenticated 
using ( (select auth.uid()) = id )
with check ( (select auth.uid()) = id );

-- create rls policy for authenticated users to delete their own profile
create policy "users can delete their own profile" 
on public.profiles 
for delete 
to authenticated 
using ( (select auth.uid()) = id );

-- create function to handle new user profile creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- insert new profile record with user's email from auth.users
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

-- create trigger to automatically create profile on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- add updated_at trigger function for profiles table
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- update the updated_at column on row modification
  new.updated_at := now();
  return new;
end;
$$;

-- create trigger to automatically update updated_at column
create trigger handle_updated_at_trigger
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- add indexes for better performance
create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists profiles_created_at_idx on public.profiles (created_at); 