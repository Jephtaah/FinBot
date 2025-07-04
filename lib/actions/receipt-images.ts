'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'

type ReceiptImageInsert = Database['public']['Tables']['receipt_images']['Insert']
type ReceiptImageRow = Database['public']['Tables']['receipt_images']['Row']

/**
 * Get current user ID or redirect to login
 */
async function getCurrentUserId() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Auth error in getCurrentUserId:', error)
    redirect('/auth/login')
  }
  
  if (!user) {
    console.log('No user found, redirecting to login')
    redirect('/auth/login')
  }
  
  return user.id
}

/**
 * Save receipt image metadata to database
 */
export async function saveReceiptImage(
  transactionId: string,
  imageData: {
    file_name: string
    file_path: string
    file_size?: number
    mime_type?: string
    storage_bucket?: string
  }
) {
  try {
    const userId = await getCurrentUserId()
    const supabase = await createClient()
    
    // Verify the transaction belongs to the current user
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('id')
      .eq('id', transactionId)
      .eq('user_id', userId)
      .single()
    
    if (transactionError || !transaction) {
      return { success: false, error: 'Transaction not found or access denied' }
    }
    
    const receiptImageData: Omit<ReceiptImageInsert, 'id' | 'uploaded_at'> = {
      transaction_id: transactionId,
      user_id: userId, // This will be auto-set by the trigger, but providing for clarity
      file_name: imageData.file_name,
      file_path: imageData.file_path,
      file_size: imageData.file_size || null,
      mime_type: imageData.mime_type || null,
      storage_bucket: imageData.storage_bucket || 'receipts',
    }
    
    const { data: receiptImage, error } = await supabase
      .from('receipt_images')
      .insert(receiptImageData)
      .select()
      .single()
    
    if (error) {
      console.error('Error saving receipt image:', error)
      return { success: false, error: 'Failed to save receipt image metadata' }
    }
    
    revalidatePath(`/dashboard/transactions`)
    revalidatePath(`/dashboard/transactions/${transactionId}`)
    
    return { success: true, data: receiptImage }
  } catch (error) {
    console.error('Error in saveReceiptImage:', error)
    return { success: false, error: 'Failed to save receipt image' }
  }
}

/**
 * Get all receipt images for a transaction
 */
export async function getReceiptImages(transactionId: string): Promise<ReceiptImageRow[]> {
  try {
    const userId = await getCurrentUserId()
    const supabase = await createClient()
    
    // Verify the transaction belongs to the current user
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('id')
      .eq('id', transactionId)
      .eq('user_id', userId)
      .single()
    
    if (transactionError || !transaction) {
      console.error('Transaction not found or access denied:', transactionError)
      return []
    }
    
    const { data, error } = await supabase
      .from('receipt_images')
      .select('*')
      .eq('transaction_id', transactionId)
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching receipt images:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Error in getReceiptImages:', error)
    return []
  }
}

/**
 * Delete a receipt image
 */
export async function deleteReceiptImage(receiptImageId: string) {
  try {
    const userId = await getCurrentUserId()
    const supabase = await createClient()
    
    // First get the receipt image to verify ownership and get file path for storage deletion
    const { data: receiptImage, error: fetchError } = await supabase
      .from('receipt_images')
      .select('*')
      .eq('id', receiptImageId)
      .eq('user_id', userId)
      .single()
    
    if (fetchError || !receiptImage) {
      return { success: false, error: 'Receipt image not found or access denied' }
    }
    
    // Delete from storage first
    const { error: storageError } = await supabase.storage
      .from(receiptImage.storage_bucket)
      .remove([receiptImage.file_path])
    
    if (storageError) {
      console.error('Error deleting file from storage:', storageError)
      // Continue with database deletion even if storage deletion fails
      // to avoid orphaned database records
    }
    
    // Delete from database
    const { error: deleteError } = await supabase
      .from('receipt_images')
      .delete()
      .eq('id', receiptImageId)
      .eq('user_id', userId)
    
    if (deleteError) {
      console.error('Error deleting receipt image from database:', deleteError)
      return { success: false, error: 'Failed to delete receipt image' }
    }
    
    revalidatePath(`/dashboard/transactions`)
    revalidatePath(`/dashboard/transactions/${receiptImage.transaction_id}`)
    
    return { success: true }
  } catch (error) {
    console.error('Error in deleteReceiptImage:', error)
    return { success: false, error: 'Failed to delete receipt image' }
  }
}

/**
 * Get receipt images for a transaction by slug
 */
export async function getReceiptImagesBySlug(slug: string): Promise<ReceiptImageRow[]> {
  try {
    const userId = await getCurrentUserId()
    const supabase = await createClient()
    
    // Get transaction by slug first
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('id')
      .eq('slug', slug)
      .eq('user_id', userId)
      .single()
    
    if (transactionError || !transaction) {
      console.error('Transaction not found or access denied:', transactionError)
      return []
    }
    
    return await getReceiptImages(transaction.id)
  } catch (error) {
    console.error('Error in getReceiptImagesBySlug:', error)
    return []
  }
}

/**
 * Get public URL for a receipt image
 */
export async function getReceiptImageUrl(filePath: string, bucketName = 'receipts'): Promise<string | null> {
  try {
    const supabase = await createClient()
    
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)
    
    return data.publicUrl
  } catch (error) {
    console.error('Error getting receipt image URL:', error)
    return null
  }
}

/**
 * Get all receipt images for the current user
 */
export async function getAllReceiptImages(): Promise<ReceiptImageRow[]> {
  try {
    const userId = await getCurrentUserId()
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('receipt_images')
      .select(`
        *,
        transactions (
          id,
          slug,
          title,
          amount,
          category,
          type
        )
      `)
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching all receipt images:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Error in getAllReceiptImages:', error)
    return []
  }
}

/**
 * Get receipt statistics for the current user
 */
export async function getReceiptStats() {
  try {
    const userId = await getCurrentUserId()
    const supabase = await createClient()
    
    // Get current month's start and end dates
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    // Count total receipts for this month
    const { count: totalReceipts, error: countError } = await supabase
      .from('receipt_images')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('uploaded_at', startOfMonth.toISOString())
      .lte('uploaded_at', endOfMonth.toISOString())
    
    if (countError) {
      console.error('Error counting receipts:', countError)
      return { totalReceipts: 0, processedReceipts: 0, totalValue: 0 }
    }
    
    // Get receipt images with their transaction details to calculate total value
    const { data: receiptsWithTransactions, error: receiptsError } = await supabase
      .from('receipt_images')
      .select(`
        id,
        uploaded_at,
        transactions (
          amount,
          type
        )
      `)
      .eq('user_id', userId)
      .gte('uploaded_at', startOfMonth.toISOString())
      .lte('uploaded_at', endOfMonth.toISOString())
    
    if (receiptsError) {
      console.error('Error fetching receipt transactions:', receiptsError)
      return { totalReceipts: totalReceipts || 0, processedReceipts: 0, totalValue: 0 }
    }
    
    // Calculate total value and processed count
    // For simplicity, we'll consider all receipts as "processed" since they're successfully uploaded
    const processedReceipts = totalReceipts || 0
    const totalValue = receiptsWithTransactions?.reduce((sum, receipt) => {
      const transaction = receipt.transactions as any
      if (transaction && transaction.amount) {
        return sum + Math.abs(transaction.amount) // Use absolute value for total
      }
      return sum
    }, 0) || 0
    
    return {
      totalReceipts: totalReceipts || 0,
      processedReceipts,
      totalValue
    }
  } catch (error) {
    console.error('Error in getReceiptStats:', error)
    return { totalReceipts: 0, processedReceipts: 0, totalValue: 0 }
  }
} 