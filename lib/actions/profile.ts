'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { validateProfileData, validateFinancialData } from '@/lib/validations/profile'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    // Validate and sanitize input data
    const validatedData = validateProfileData(formData)
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        full_name: validatedData.fullName,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) throw error

    revalidatePath('/dashboard/account')
    return { success: true }
  } catch (error: any) {
    console.error('Error updating profile:', error)
    return { success: false, error: error.message || 'Failed to update profile' }
  }
}

export async function updateFinancialInfo(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    // Validate and sanitize financial input data
    const validatedData = validateFinancialData(formData)
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        monthly_income: validatedData.monthlyIncome,
        monthly_expense: validatedData.monthlyExpenses,
        savings_goal: validatedData.savingsGoal,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) throw error

    revalidatePath('/dashboard/account')
    return { success: true }
  } catch (error: any) {
    console.error('Error updating financial info:', error)
    return { success: false, error: error.message || 'Failed to update financial information' }
  }
}