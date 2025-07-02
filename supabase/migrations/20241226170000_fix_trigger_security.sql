-- migration: fix trigger function security to use SECURITY DEFINER
-- purpose: ensure trigger function has proper permissions to insert into profiles table
-- issue: SECURITY INVOKER may not have correct permissions during auth trigger execution

-- update function to use SECURITY DEFINER for proper permissions
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = 'public, auth'
as $$
begin
  -- insert new profile record with user's email and full_name from metadata
  insert into public.profiles (id, email, full_name)
  values (
    new.id, 
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', null)
  );
  return new;
end;
$$; 