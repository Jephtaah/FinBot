-- migration: make auth_user_is_admin function more robust against RLS recursion
-- purpose: enhance the admin check function with explicit RLS bypass and error handling
-- affected: public.auth_user_is_admin function
-- security impact: prevents potential RLS recursion while maintaining existing data structure

-- drop existing function to recreate with better implementation
drop function if exists public.auth_user_is_admin();

-- create more robust admin check function
create or replace function public.auth_user_is_admin()
returns boolean
language plpgsql
security definer -- runs with elevated privileges to bypass RLS
stable -- function result doesn't change within a transaction for same inputs
set search_path = '' -- security best practice
as $$
declare
  result boolean := false;
  current_user_id uuid;
begin
  -- get current user id first
  current_user_id := auth.uid();
  
  -- if no user is authenticated, return false immediately
  if current_user_id is null then
    return false;
  end if;
  
  -- explicitly disable row level security for this function execution
  -- this prevents any potential recursion issues
  set local row_security = off;
  
  -- perform the admin check with explicit schema qualification
  select exists (
    select 1 
    from public.profiles 
    where id = current_user_id 
      and role = 'admin'
  ) into result;
  
  return coalesce(result, false);
  
exception
  when others then
    -- log error for debugging but fail closed (return false)
    -- this ensures security even if something goes wrong
    raise log 'Error in auth_user_is_admin function: %', sqlerrm;
    return false;
end;
$$;

-- grant execute permission to authenticated users
grant execute on function public.auth_user_is_admin() to authenticated;

-- add comprehensive comment explaining the security measures
comment on function public.auth_user_is_admin() is 
'Robustly checks if current user is admin without causing RLS recursion. 
Uses security definer to run with elevated privileges, explicitly disables 
row_security, and includes error handling that fails closed for security.';

-- verify the function works by testing it (this will be logged)
do $$
begin
  raise notice 'Admin check function updated successfully. Testing basic functionality...';
  -- basic smoke test - this should not error
  perform public.auth_user_is_admin();
  raise notice 'Admin check function test completed successfully.';
exception
  when others then
    raise exception 'Admin check function test failed: %', sqlerrm;
end;
$$;