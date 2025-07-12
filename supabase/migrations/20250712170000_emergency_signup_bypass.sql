-- migration: emergency signup bypass - disable problematic trigger
-- purpose: temporarily disable trigger to allow signups while debugging
-- affected: auth.users trigger (disabled), manual profile creation
-- issue: trigger causing "Database error saving new user" - need immediate fix

-- step 1: disable the problematic trigger temporarily
drop trigger if exists on_auth_user_created on auth.users;

-- step 2: create a simple function to manually create profiles when needed
create or replace function public.create_user_profile_if_missing()
returns json
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid;
  profile_exists boolean;
  result json;
begin
  -- get current user
  current_user_id := auth.uid();
  
  if current_user_id is null then
    return json_build_object(
      'success', false,
      'error', 'User not authenticated'
    );
  end if;
  
  -- check if profile already exists
  select exists(
    select 1 from public.profiles where id = current_user_id
  ) into profile_exists;
  
  if profile_exists then
    return json_build_object(
      'success', true,
      'message', 'Profile already exists'
    );
  end if;
  
  -- create basic profile
  begin
    insert into public.profiles (
      id, 
      email,
      role,
      created_at,
      updated_at
    )
    select 
      au.id,
      au.email,
      'user'::user_role,
      now(),
      now()
    from auth.users au
    where au.id = current_user_id;
    
    return json_build_object(
      'success', true,
      'message', 'Profile created successfully'
    );
    
  exception
    when others then
      return json_build_object(
        'success', false,
        'error', sqlerrm,
        'sqlstate', sqlstate
      );
  end;
end;
$$;

-- step 3: create a function to update profile with additional data
create or replace function public.update_user_profile(
  user_full_name text default null
)
returns json
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid;
  result json;
begin
  current_user_id := auth.uid();
  
  if current_user_id is null then
    return json_build_object(
      'success', false,
      'error', 'User not authenticated'
    );
  end if;
  
  -- ensure profile exists first
  perform public.create_user_profile_if_missing();
  
  -- update profile with provided data
  begin
    update public.profiles 
    set 
      full_name = coalesce(user_full_name, full_name),
      updated_at = now()
    where id = current_user_id;
    
    return json_build_object(
      'success', true,
      'message', 'Profile updated successfully'
    );
    
  exception
    when others then
      return json_build_object(
        'success', false,
        'error', sqlerrm
      );
  end;
end;
$$;

-- grant execute permissions
grant execute on function public.create_user_profile_if_missing() to authenticated;
grant execute on function public.update_user_profile(text) to authenticated;

-- add helpful comments
comment on function public.create_user_profile_if_missing() is 'Emergency function to create profiles when trigger is disabled';
comment on function public.update_user_profile(text) is 'Update user profile with additional data after signup';

-- log that trigger has been disabled
do $$
begin
  raise notice 'EMERGENCY: Auth trigger disabled. Profiles must be created manually via create_user_profile_if_missing()';
end;
$$;