// Database type definitions for Supabase tables
// Re-export the generated types from the actual database schema

import type { Database as SupabaseDatabase } from './supabase'

export type { Database, Tables, TablesInsert, TablesUpdate } from './supabase'

// Convenient type aliases for the profiles table
export type Profile = SupabaseDatabase['public']['Tables']['profiles']['Row']
export type ProfileInsert = SupabaseDatabase['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = SupabaseDatabase['public']['Tables']['profiles']['Update'] 