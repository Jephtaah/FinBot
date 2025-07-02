// Profile-specific types for the application

import { Profile as DatabaseProfile, ProfileInsert, ProfileUpdate } from './database'

// Re-export database types
export type { ProfileInsert, ProfileUpdate }

// Main profile type with better naming for app usage
export type UserProfile = DatabaseProfile

// Partial profile for forms and updates
export type ProfileFormData = {
  full_name?: string
  avatar_url?: string
  monthly_income?: number
  monthly_expense?: number
  savings_goal?: number
}

// Profile statistics and computed fields
export type ProfileStats = {
  monthly_surplus: number
  savings_rate: number
  goal_timeline_months: number | null
}

// Onboarding progress tracking
export type OnboardingProgress = {
  personal_info_completed: boolean
  financial_info_completed: boolean
  goals_completed: boolean
  is_complete: boolean
}

// Financial health indicators
export type FinancialHealth = {
  emergency_fund_months: number
  debt_to_income_ratio: number
  savings_rate: number
  budget_variance: number
}

// Profile with computed stats
export type ExtendedProfile = UserProfile & {
  stats?: ProfileStats
  onboarding?: OnboardingProgress
  financial_health?: FinancialHealth
} 