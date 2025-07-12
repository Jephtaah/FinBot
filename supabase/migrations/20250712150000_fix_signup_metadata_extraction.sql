-- migration: fix signup to properly extract user metadata
-- purpose: ensure full_name is extracted from auth metadata during signup
-- affected tables: profiles (trigger function fix)
-- issue: handle_new_user function was setting full_name to null instead of extracting from metadata

-- fix the handle_new_user function to properly extract metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- insert new profile record with user's email, default 'user' role, and metadata
  -- extract full_name from raw_user_meta_data passed during signup
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
    coalesce(new.raw_user_meta_data->>'full_name', null), -- extract from signup metadata
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

-- ensure the trigger is properly attached (defensive programming)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- add helpful comment
comment on function public.handle_new_user() is 'Creates profile record on user signup, extracting full_name from auth metadata if provided';

-- verify the function is working by checking dependencies
select 
  p.proname as function_name,
  t.trigger_name,
  t.event_object_table,
  t.action_timing,
  t.action_statement
from pg_proc p
left join information_schema.triggers t on t.action_statement like '%' || p.proname || '%'
where p.proname = 'handle_new_user';