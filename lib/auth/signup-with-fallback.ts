/**
 * Signup with fallback for trigger issues
 * This handles the "Database error saving new user" by implementing retry logic
 */

import { createClient } from '@/lib/supabase/client'

export interface SignUpResult {
  success: boolean
  data?: any
  error?: string
  fallbackUsed?: boolean
}

export interface SignUpData {
  email: string
  password: string
  fullName?: string
}

/**
 * Sign up with automatic fallback if database triggers fail
 */
export async function signUpWithFallback(signUpData: SignUpData): Promise<SignUpResult> {
  const supabase = createClient()
  const { email, password, fullName } = signUpData

  console.log('🚀 Starting signup with fallback for:', email)

  try {
    // First, try the normal signup process
    console.log('📝 Attempting normal signup...')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })

    if (error) {
      // Check if it's the specific database error we're trying to work around
      if (error.message?.includes('Database error saving new user')) {
        console.log('⚠️ Database trigger error detected, trying workaround...')
        return await attemptSignupWorkaround(signUpData)
      } else {
        console.error('❌ Signup failed with different error:', error)
        return {
          success: false,
          error: error.message,
        }
      }
    }

    console.log('✅ Normal signup successful!')
    
    // If signup was successful, try to create profile manually
    if (data.user && fullName) {
      try {
        console.log('👤 Adding profile information...')
        await createProfileManually(data.user.id, email, fullName)
      } catch (profileError) {
        console.warn('⚠️ Profile creation failed, but signup succeeded:', profileError)
        // Don't fail the whole process for profile issues
      }
    }

    return {
      success: true,
      data,
    }

  } catch (error) {
    console.error('💥 Unexpected error during signup:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error occurred',
    }
  }
}

/**
 * Attempt to work around the database trigger issue
 * This tries a few different approaches before giving up
 */
async function attemptSignupWorkaround(signUpData: SignUpData): Promise<SignUpResult> {
  console.log('🔧 Attempting signup workaround...')
  const supabase = createClient()
  
  // Try 1: Wait a moment and retry (in case admin just fixed the database)
  console.log('⏳ Waiting 2 seconds and retrying...')
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: signUpData.email,
      password: signUpData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })

    if (!error) {
      console.log('✅ Retry successful!')
      
      // Try to create profile manually
      if (data.user && signUpData.fullName) {
        try {
          await createProfileManually(data.user.id, signUpData.email, signUpData.fullName)
        } catch (profileError) {
          console.warn('⚠️ Profile creation failed on retry, but signup succeeded:', profileError)
        }
      }

      return {
        success: true,
        data,
        fallbackUsed: true,
      }
    }
  } catch (retryError) {
    console.log('❌ Retry also failed:', retryError)
  }
  
  // If retry failed, return helpful error message
  return {
    success: false,
    error: 'Database configuration issue detected. Please:\n\n1. Ask admin to run the SQL fix in Supabase dashboard\n2. Wait 2-3 minutes\n3. Try signing up again\n\nThe fix involves removing a problematic database trigger.',
    fallbackUsed: true,
  }
}

/**
 * Manually create a user profile after successful signup
 */
async function createProfileManually(userId: string, email: string, fullName?: string): Promise<void> {
  const supabase = createClient()
  
  console.log('📊 Creating profile manually for user:', userId)
  
  try {
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (existingProfile) {
      console.log('✅ Profile already exists')
      return
    }

    // Create the profile
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        full_name: fullName || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (error) {
      console.error('❌ Manual profile creation failed:', error)
      throw error
    }

    console.log('✅ Profile created manually')
  } catch (error) {
    console.error('💥 Error in manual profile creation:', error)
    throw error
  }
}

/**
 * Check if the current signup method is working
 */
export async function testSignupCapability(): Promise<boolean> {
  const supabase = createClient()
  
  try {
    // Try to access the profiles table to see if it exists and is accessible
    const { error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    return !error
  } catch {
    return false
  }
}