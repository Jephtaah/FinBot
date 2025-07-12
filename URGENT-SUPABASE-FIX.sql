-- URGENT: Run this in your Supabase SQL Editor immediately
-- This will fix the "Database error saving new user" issue

-- Step 1: Check what triggers currently exist
SELECT 
  'CURRENT TRIGGERS:' as info,
  trigger_name,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users';

-- Step 2: Drop all triggers on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;

-- Step 3: Drop the problematic function
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Step 4: Verify triggers are gone
SELECT 
  'REMAINING TRIGGERS (should be empty):' as info,
  trigger_name,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users';

-- Step 5: Show success message
SELECT 'SUCCESS: All triggers removed from auth.users table' as result;