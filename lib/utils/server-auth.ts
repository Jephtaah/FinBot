import { createClient } from '@/lib/supabase/server'

/**
 * Server-side function to check if the current user is an admin
 * This fails closed (throws error) on authentication failures
 * @returns Promise<boolean> - true if user is admin
 * @throws Error if user is not authenticated or check fails
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('User not authenticated')
  }
  
  // Check admin status using RPC
  const { data: isAdmin, error: adminError } = await supabase.rpc('auth_user_is_admin')
  
  if (adminError) {
    throw new Error(`Admin check failed: ${adminError.message}`)
  }
  
  return Boolean(isAdmin)
}

/**
 * Server-side function to require admin access
 * Throws error if user is not admin
 * @throws Error if user is not admin or not authenticated
 */
export async function requireAdmin(): Promise<void> {
  const isAdmin = await isCurrentUserAdmin()
  
  if (!isAdmin) {
    throw new Error('Admin access required')
  }
}

/**
 * Server-side function to get current user with role information
 * @returns Promise<{user: User, isAdmin: boolean}> - user and admin status
 * @throws Error if user is not authenticated
 */
export async function getCurrentUserWithRole() {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('User not authenticated')
  }
  
  try {
    const isAdmin = await isCurrentUserAdmin()
    return { user, isAdmin }
  } catch {
    // If admin check fails, assume regular user but still return authenticated user
    return { user, isAdmin: false }
  }
}

/**
 * Server-side function to get the appropriate dashboard URL
 * @returns Promise<string> - '/admin' for admins, '/dashboard' for regular users
 */
export async function getDashboardUrl(): Promise<string> {
  try {
    const isAdmin = await isCurrentUserAdmin()
    return isAdmin ? '/admin' : '/dashboard'
  } catch {
    // If check fails, default to regular dashboard
    return '/dashboard'
  }
}