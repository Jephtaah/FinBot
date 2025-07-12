'use client';

import { createClient } from '@/lib/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-user';
import type { Message } from '@/types/chat';

export function useChatHistory(assistantId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { user } = useUser();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['chat-history', assistantId, user?.id],
    queryFn: async () => {
      if (!user) {
        console.log('No user, returning empty messages');
        return [];
      }
      
      console.log('Fetching chat history for:', { assistantId, userId: user.id });
      console.log('Query will be: messages where assistant_id =', assistantId, 'AND user_id =', user.id);
      
      const query = supabase
        .from('messages')
        .select('*')
        .eq('assistant_id', assistantId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      
      console.log('Executing query with filters:', { assistant_id: assistantId, user_id: user.id });
      
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching chat history:', error);
        return [];
      }
      
      console.log('Chat history fetched:', { 
        count: data?.length || 0, 
        assistantId,
        messages: data?.map(m => ({ id: m.id, assistant_id: m.assistant_id, role: m.role, content: m.content.substring(0, 50) + '...' }))
      });
      return data as Message[];
    },
    enabled: !!user,
  });

  const { mutate: saveMessage } = useMutation({
    mutationFn: async (message: Omit<Message, 'id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('User not authenticated');
      
      console.log('Attempting to save message:', { 
        ...message, 
        user_id: user.id,
        expected_assistant_id: assistantId 
      });
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          ...message,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error saving message:', error);
        throw error;
      }
      
      console.log('Message saved successfully:', data);
      return data;
    },
    onSuccess: () => {
      console.log('Message save mutation succeeded, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['chat-history', assistantId, user?.id] });
    },
    onError: (error) => {
      console.error('Error saving message:', error);
    },
  });

  const { mutate: clearHistory } = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('assistant_id', assistantId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-history', assistantId, user?.id] });
    },
    onError: (error) => {
      console.error('Error clearing chat history:', error);
    },
  });

  return {
    messages: messages || [],
    isLoading,
    saveMessage,
    clearHistory,
  };
}