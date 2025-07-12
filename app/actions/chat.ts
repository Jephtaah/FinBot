'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function clearChatHistory(assistantId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    console.log('Clearing chat history for:', { userId: user.id, assistantId })

    // Use the stored procedure
    const { error } = await supabase.rpc('delete_chat_messages', {
      p_user_id: user.id,
      p_assistant_id: assistantId
    })

    if (error) {
      console.error('Error clearing chat:', error)
      return { success: false, error: 'Failed to clear chat history' }
    }

    // Revalidate the chat page to update the UI
    revalidatePath('/dashboard/chat/[assistant]', 'page')
    
    return { success: true }
  } catch (error) {
    console.error('Error clearing chat:', error)
    return { success: false, error: 'Failed to clear chat history' }
  }
}

export async function fetchChatHistoryForExport(assistantId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Use select query
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('assistant_id', assistantId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching chat history:', error)
      return { success: false, error: 'Failed to fetch chat history' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error fetching chat history:', error)
    return { success: false, error: 'Failed to fetch chat history' }
  }
}