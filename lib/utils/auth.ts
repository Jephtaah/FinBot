import { createClient } from '@/lib/supabase/client'

/**
 * Check if the current user is an admin (client-side)
 * @returns Promise<boolean> - true if user is admin, false otherwise
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data: isAdmin, error } = await supabase.rpc('auth_user_is_admin')
    
    if (error) {
      console.error('Error checking admin status:', error)
      return false
    }
    
    return isAdmin || false
  } catch (error) {
    console.error('Error in isCurrentUserAdmin:', error)
    return false
  }
}

/**
 * Get the appropriate dashboard URL for the current user
 * @returns Promise<string> - '/admin' for admins, '/dashboard' for regular users
 */
export async function getDashboardUrl(): Promise<string> {
  const isAdmin = await isCurrentUserAdmin()
  return isAdmin ? '/admin' : '/dashboard'
}