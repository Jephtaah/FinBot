import { createClient } from '@/lib/supabase/client'

/**
 * Check if the current user is an admin (client-side)
 * SECURITY: This function now fails closed - returns false on any error
 * For server-side admin checks, use server-auth.ts functions instead
 * @returns Promise<boolean> - true if user is admin, false on error/not admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const supabase = createClient()
    
    // First verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.warn('User not authenticated for admin check')
      return false
    }
    
    // Check admin status using RPC
    const { data: isAdmin, error: adminError } = await supabase.rpc('auth_user_is_admin')
    
    if (adminError) {
      console.error('Error checking admin status:', adminError)
      return false // Fail closed
    }
    
    return Boolean(isAdmin)
  } catch (error) {
    console.error('Error in isCurrentUserAdmin:', error)
    return false // Fail closed
  }
}

/**
 * Get the appropriate dashboard URL for the current user (client-side)
 * SECURITY: Defaults to regular dashboard on any error
 * For server-side routing decisions, use server-auth.ts functions instead
 * @returns Promise<string> - '/admin' for admins, '/dashboard' for regular users or on error
 */
export async function getDashboardUrl(): Promise<string> {
  try {
    const isAdmin = await isCurrentUserAdmin()
    return isAdmin ? '/admin' : '/dashboard'
  } catch (error) {
    console.error('Error getting dashboard URL:', error)
    return '/dashboard' // Fail to regular dashboard
  }
}