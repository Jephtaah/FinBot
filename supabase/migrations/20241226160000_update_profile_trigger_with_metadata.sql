-- migration: update profile trigger to handle user metadata
-- purpose: extract full_name from user metadata during profile creation
-- affected tables: profiles (trigger function update)

-- update function to handle new user profile creation with metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security invoker
set search_path = ''
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