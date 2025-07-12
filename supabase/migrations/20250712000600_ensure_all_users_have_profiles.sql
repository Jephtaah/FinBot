-- migration: ensure all existing auth users have profile records
-- purpose: create profile records for any auth users who might not have them yet
-- affected tables: profiles (insert missing records)

-- insert profile records for any auth users that don't have profiles yet
insert into public.profiles (id, email, role)
select 
  au.id, 
  au.email,
  'user'::user_role as role
from auth.users au
left join public.profiles p on au.id = p.id
where p.id is null
and au.email is not null;

-- update any existing profiles that don't have a role set
update public.profiles 
set role = 'user'::user_role 
where role is null;