-- migration: comprehensive database diagnosis for signup issues
-- purpose: diagnose all potential causes of "Database error saving new user"
-- approach: check everything that could interfere with auth.users insert

-- check 1: verify auth schema and users table
do $$
begin
  raise notice '=== AUTH SCHEMA DIAGNOSIS ===';
  
  -- check if auth schema exists
  if exists (select 1 from information_schema.schemata where schema_name = 'auth') then
    raise notice 'AUTH SCHEMA: exists';
  else
    raise error 'AUTH SCHEMA: MISSING - this is a critical error';
  end if;
  
  -- check if auth.users table exists
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'auth' and table_name = 'users'
  ) then
    raise notice 'AUTH.USERS TABLE: exists';
  else
    raise error 'AUTH.USERS TABLE: MISSING - this is a critical error';
  end if;
end;
$$;

-- check 2: verify no triggers exist on auth.users
do $$
declare
  trigger_rec record;
  trigger_count integer := 0;
begin
  raise notice '=== AUTH.USERS TRIGGERS ===';
  
  for trigger_rec in 
    select trigger_name, event_manipulation, action_statement
    from information_schema.triggers
    where event_object_schema = 'auth' 
      and event_object_table = 'users'
  loop
    trigger_count := trigger_count + 1;
    raise notice 'TRIGGER FOUND: % (%) - %', 
      trigger_rec.trigger_name, 
      trigger_rec.event_manipulation,
      trigger_rec.action_statement;
  end loop;
  
  if trigger_count = 0 then
    raise notice 'NO TRIGGERS: auth.users table has no triggers (this is what we want)';
  else
    raise warning 'TRIGGERS EXIST: % triggers found on auth.users - these could be causing the error', trigger_count;
  end if;
end;
$$;

-- check 3: verify profiles table structure
do $$
declare
  col_rec record;
begin
  raise notice '=== PROFILES TABLE STRUCTURE ===';
  
  -- check if profiles table exists
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'profiles'
  ) then
    raise notice 'PROFILES TABLE: exists';
    
    -- show all columns
    for col_rec in
      select column_name, data_type, is_nullable, column_default
      from information_schema.columns
      where table_schema = 'public' and table_name = 'profiles'
      order by ordinal_position
    loop
      raise notice 'COLUMN: % (%) nullable=% default=%', 
        col_rec.column_name, 
        col_rec.data_type, 
        col_rec.is_nullable,
        coalesce(col_rec.column_default, 'none');
    end loop;
  else
    raise notice 'PROFILES TABLE: does not exist (this might be ok)';
  end if;
end;
$$;

-- check 4: verify RLS policies on profiles
do $$
declare
  policy_rec record;
  policy_count integer := 0;
begin
  raise notice '=== PROFILES TABLE RLS POLICIES ===';
  
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'profiles'
  ) then
    for policy_rec in
      select schemaname, tablename, policyname, permissive, roles, cmd, qual
      from pg_policies
      where schemaname = 'public' and tablename = 'profiles'
    loop
      policy_count := policy_count + 1;
      raise notice 'POLICY: % (%) for % - %', 
        policy_rec.policyname,
        policy_rec.cmd,
        policy_rec.roles,
        policy_rec.permissive;
    end loop;
    
    if policy_count = 0 then
      raise notice 'NO RLS POLICIES: profiles table has no RLS policies';
    else
      raise notice 'RLS POLICIES: % policies found on profiles table', policy_count;
    end if;
  end if;
end;
$$;

-- check 5: verify user_role enum exists
do $$
begin
  raise notice '=== USER_ROLE ENUM ===';
  
  if exists (select 1 from pg_type where typname = 'user_role') then
    raise notice 'USER_ROLE ENUM: exists';
    
    -- show enum values
    for val in
      select enumlabel
      from pg_enum
      where enumtypid = (select oid from pg_type where typname = 'user_role')
      order by enumsortorder
    loop
      raise notice 'ENUM VALUE: %', val;
    end loop;
  else
    raise notice 'USER_ROLE ENUM: does not exist';
  end if;
end;
$$;

-- check 6: look for any foreign key constraints that might fail
do $$
declare
  fk_rec record;
begin
  raise notice '=== FOREIGN KEY CONSTRAINTS ===';
  
  for fk_rec in
    select 
      tc.constraint_name,
      tc.table_schema,
      tc.table_name,
      kcu.column_name,
      ccu.table_schema as foreign_table_schema,
      ccu.table_name as foreign_table_name,
      ccu.column_name as foreign_column_name
    from information_schema.table_constraints as tc
    join information_schema.key_column_usage as kcu
      on tc.constraint_name = kcu.constraint_name
      and tc.table_schema = kcu.table_schema
    join information_schema.constraint_column_usage as ccu
      on ccu.constraint_name = tc.constraint_name
      and ccu.table_schema = tc.table_schema
    where tc.constraint_type = 'FOREIGN KEY'
      and (tc.table_name = 'profiles' or ccu.table_name = 'users')
  loop
    raise notice 'FK CONSTRAINT: %.% (%) -> %.% (%)',
      fk_rec.table_schema,
      fk_rec.table_name,
      fk_rec.column_name,
      fk_rec.foreign_table_schema,
      fk_rec.foreign_table_name,
      fk_rec.foreign_column_name;
  end loop;
end;
$$;

-- check 7: test if we can manually insert into auth.users (if safe to do)
-- NOTE: This is commented out as it could interfere with auth
/*
do $$
declare
  test_id uuid;
begin
  raise notice '=== AUTH.USERS INSERT TEST ===';
  test_id := gen_random_uuid();
  
  -- try a minimal insert to see what fails
  begin
    insert into auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
    values (
      test_id,
      'test-' || extract(epoch from now()) || '@example.com',
      'dummy',
      now(),
      now(),
      now()
    );
    
    -- clean up immediately
    delete from auth.users where id = test_id;
    
    raise notice 'AUTH.USERS INSERT: SUCCESS - basic insert works';
    
  exception
    when others then
      raise notice 'AUTH.USERS INSERT: FAILED - %', sqlerrm;
  end;
end;
$$;
*/

-- final summary
do $$
begin
  raise notice '=== DIAGNOSTIC COMPLETE ===';
  raise notice 'Check the output above for any issues that could cause signup failures';
  raise notice 'Common causes:';
  raise notice '1. Triggers still exist on auth.users';
  raise notice '2. Foreign key constraints failing';
  raise notice '3. RLS policies blocking operations';
  raise notice '4. Missing required columns or types';
end;
$$;