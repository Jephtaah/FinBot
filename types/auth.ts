// Authentication-related types

import { User } from '@supabase/supabase-js'
import { UserProfile } from './profile'

// Extended user type that includes profile data
export type AuthUser = User & {
  profile?: UserProfile
}

// Session state types
export type AuthState = {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
}

// Auth form types
export type LoginFormData = {
  email: string
  password: string
}

export type SignUpFormData = {
  email: string
  password: string
  full_name?: string
}

export type ForgotPasswordFormData = {
  email: string
}

export type UpdatePasswordFormData = {
  password: string
  confirmPassword: string
}

// Auth action results
export type AuthResult = {
  success: boolean
  error?: string
  message?: string
}

// Auth context type
export type AuthContextType = {
  user: AuthUser | null
  signIn: (data: LoginFormData) => Promise<AuthResult>
  signUp: (data: SignUpFormData) => Promise<AuthResult>
  signOut: () => Promise<AuthResult>
  resetPassword: (data: ForgotPasswordFormData) => Promise<AuthResult>
  updatePassword: (data: UpdatePasswordFormData) => Promise<AuthResult>
  isLoading: boolean
} 