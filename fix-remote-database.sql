-- IMMEDIATE FIX FOR REMOTE SUPABASE DATABASE
-- Run this directly in your Supabase SQL Editor
-- This will fix the "Database error saving new user" issue

-- Step 1: Check current state
DO $$
BEGIN
  RAISE NOTICE 'Checking current triggers on auth.users...';
END $$;

SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users';

-- Step 2: Drop ALL triggers on auth.users
DO $$
DECLARE
  trigger_rec record;
BEGIN
  RAISE NOTICE 'Dropping all triggers on auth.users...';
  
  FOR trigger_rec IN
    SELECT trigger_name
    FROM information_schema.triggers
    WHERE event_object_schema = 'auth' 
      AND event_object_table = 'users'
  LOOP
    EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_rec.trigger_name || ' ON auth.users';
    RAISE NOTICE 'Dropped trigger: %', trigger_rec.trigger_name;
  END LOOP;
END $$;

-- Step 3: Drop the problematic function
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Step 4: Verify profiles table exists and is properly configured
DO $$
BEGIN
  -- Check if profiles table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    RAISE NOTICE 'Creating profiles table...';
    
    CREATE TABLE public.profiles (
      id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email text,
      full_name text,
      role text DEFAULT 'user',
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    
    -- Enable RLS
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    
    -- Create basic policies
    CREATE POLICY "Users can view own profile" ON public.profiles
      FOR SELECT TO authenticated
      USING (auth.uid() = id);
      
    CREATE POLICY "Users can update own profile" ON public.profiles
      FOR UPDATE TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
      
    CREATE POLICY "Users can insert own profile" ON public.profiles
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = id);
    
    RAISE NOTICE 'Profiles table created with basic RLS policies';
  ELSE
    RAISE NOTICE 'Profiles table already exists';
  END IF;
END $$;

-- Step 5: Create manual profile creation function
CREATE OR REPLACE FUNCTION public.create_profile_if_missing()
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  current_user_id uuid;
  user_email text;
  result json;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Not authenticated'
    );
  END IF;
  
  -- Check if profile exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = current_user_id) THEN
    RETURN json_build_object(
      'success', true,
      'message', 'Profile already exists'
    );
  END IF;
  
  -- Get email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  -- Create profile
  BEGIN
    INSERT INTO public.profiles (id, email, created_at, updated_at)
    VALUES (current_user_id, user_email, now(), now())
    ON CONFLICT (id) DO NOTHING;
    
    RETURN json_build_object(
      'success', true,
      'message', 'Profile created successfully',
      'user_id', current_user_id
    );
    
  EXCEPTION
    WHEN OTHERS THEN
      RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'user_id', current_user_id
      );
  END;
END;
$$;

-- Step 6: Grant permissions
GRANT EXECUTE ON FUNCTION public.create_profile_if_missing() TO authenticated;

-- Step 7: Final verification
DO $$
DECLARE
  trigger_count integer;
BEGIN
  SELECT count(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE event_object_schema = 'auth' 
    AND event_object_table = 'users';
  
  IF trigger_count = 0 THEN
    RAISE NOTICE 'SUCCESS: No triggers on auth.users - signup should work now!';
  ELSE
    RAISE WARNING 'WARNING: % triggers still exist on auth.users', trigger_count;
  END IF;
END $$;

-- Step 8: Test the manual profile creation function
SELECT public.create_profile_if_missing() as test_result;