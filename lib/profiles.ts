// Utility functions for profiles table interactions

import { createClient } from './supabase/server'
import { Profile, ProfileInsert, ProfileUpdate } from '../types/database'

/**
 * Get a user's profile by their auth ID
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient()
  
  // Ensure user has a profile record first (emergency bypass safety net)
  try {
    await supabase.rpc('create_user_profile_if_missing')
  } catch (error) {
    console.warn('Profile creation safety net failed:', error)
    // Continue anyway - profile might already exist
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data
}

/**
 * Create a new profile (used by the trigger, but can be called manually if needed)
 */
export async function createProfile(profileData: ProfileInsert): Promise<Profile | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .insert(profileData)
    .select()
    .single()

  if (error) {
    console.error('Error creating profile:', error)
    return null
  }

  return data
}

/**
 * Update a user's profile
 */
export async function updateProfile(
  userId: string, 
  updates: ProfileUpdate
): Promise<Profile | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    return null
  }

  return data
}

/**
 * Delete a user's profile
 */
export async function deleteProfile(userId: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId)

  if (error) {
    console.error('Error deleting profile:', error)
    return false
  }

  return true
}

/**
 * Calculate profile statistics from the financial data
 */
export function calculateProfileStats(profile: Profile) {
  const monthlyIncome = profile.monthly_income || 0
  const monthlyExpense = profile.monthly_expense || 0
  const savingsGoal = profile.savings_goal || 0
  
  const monthlySurplus = monthlyIncome - monthlyExpense
  const savingsRate = monthlyIncome > 0 ? (monthlySurplus / monthlyIncome) * 100 : 0
  const goalTimelineMonths = monthlySurplus > 0 ? Math.ceil(savingsGoal / monthlySurplus) : null

  return {
    monthly_surplus: monthlySurplus,
    savings_rate: Math.round(savingsRate * 100) / 100, // Round to 2 decimal places
    goal_timeline_months: goalTimelineMonths
  }
}

/**
 * Check if profile onboarding is complete
 */
export function checkOnboardingStatus(profile: Profile) {
  const personalInfoCompleted = !!(profile.full_name && profile.email)
  const financialInfoCompleted = !!(
    profile.monthly_income !== null && 
    profile.monthly_expense !== null
  )
  const goalsCompleted = profile.savings_goal !== null
  
  return {
    personal_info_completed: personalInfoCompleted,
    financial_info_completed: financialInfoCompleted,
    goals_completed: goalsCompleted,
    is_complete: personalInfoCompleted && financialInfoCompleted && goalsCompleted
  }
} 