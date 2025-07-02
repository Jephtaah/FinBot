-- migration: add RLS policy to allow service role to insert profiles
-- purpose: ensure trigger function can insert profiles even with RLS enabled
-- note: this policy allows the service role to insert profiles for the trigger

-- create policy to allow service role to insert profiles (for trigger function)
create policy "service role can insert profiles"
on public.profiles
for insert
to service_role
with check ( true ); 