# Chat Clearing Implementation Guide

## Overview
This guide outlines the implementation of a chat clearing feature that allows users to delete their entire chat history with a specific AI assistant. The feature includes a confirmation dialog to prevent accidental deletions and handles the permanent removal of messages from the database.

## Implementation Steps

### 1. Database Function
Create a Supabase database function to handle message deletion:

```sql
CREATE OR REPLACE FUNCTION delete_chat_messages(
  p_user_id UUID,
  p_assistant_id TEXT
)
RETURNS void AS $$
BEGIN
  -- Delete messages for specific user and assistant
  DELETE FROM messages
  WHERE user_id = p_user_id
  AND assistant_id = p_assistant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policy
CREATE POLICY "Users can only delete their own messages"
  ON messages
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

### 2. Server Action
Create a server action to handle the deletion request:

```typescript
// app/actions/chat.ts
'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function clearChatHistory(assistantId: string) {
  const supabase = createServerActionClient({ cookies })
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    await supabase.rpc('delete_chat_messages', {
      p_user_id: user.id,
      p_assistant_id: assistantId
    })

    revalidatePath('/dashboard/chat/[assistant]')
    return { success: true }
  } catch (error) {
    console.error('Error clearing chat:', error)
    return { success: false, error: 'Failed to clear chat history' }
  }
}
```

### 3. UI Components

#### Alert Dialog Component
Create a reusable confirmation dialog using Shadcn UI:

```typescript
// components/ui/alert-dialog.tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface DeleteChatDialogProps {
  onConfirm: () => Promise<void>
  children: React.ReactNode
}

export function DeleteChatDialog({ onConfirm, children }: DeleteChatDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear Chat History</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to clear all messages? This action cannot be undone 
            and will permanently delete all messages in this conversation.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Clear Chat
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

### 4. Integration
Add the clear chat functionality to the chat interface:

```typescript
// components/chat/chat-interface.tsx
'use client'

import { Button } from "@/components/ui/button"
import { DeleteChatDialog } from "@/components/ui/alert-dialog"
import { clearChatHistory } from "@/app/actions/chat"
import { useToast } from "@/components/ui/use-toast"

export function ChatActions({ assistantId }: { assistantId: string }) {
  const { toast } = useToast()

  const handleClearChat = async () => {
    const result = await clearChatHistory(assistantId)
    
    if (result.success) {
      toast({
        title: "Chat cleared",
        description: "All messages have been deleted.",
      })
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  return (
    <DeleteChatDialog onConfirm={handleClearChat}>
      <Button variant="destructive">
        Clear Chat
      </Button>
    </DeleteChatDialog>
  )
}
```

## Security Considerations

1. **Row Level Security (RLS)**
   - Ensure RLS policies are properly configured to prevent unauthorized deletions
   - Users should only be able to delete their own messages
   - Use `auth.uid()` to verify user identity

2. **Server-Side Validation**
   - Always verify user authentication before processing deletion requests
   - Validate assistant IDs to prevent manipulation
   - Use server actions instead of direct API calls

3. **Rate Limiting**
   - Consider implementing rate limiting to prevent abuse
   - Monitor deletion patterns for suspicious activity

## Error Handling

1. **Client-Side**
   - Display clear error messages to users
   - Provide feedback on successful deletions
   - Handle network errors gracefully

2. **Server-Side**
   - Log errors for debugging
   - Return appropriate error messages
   - Handle database transaction failures

## Testing

1. **Unit Tests**
   - Test server action with various scenarios
   - Verify RLS policies work as expected
   - Test error handling

2. **Integration Tests**
   - Test full deletion flow
   - Verify UI updates after deletion
   - Test with different user roles

3. **E2E Tests**
   - Test complete user flow
   - Verify database state after deletion
   - Test error scenarios

## User Experience

1. **Confirmation Dialog**
   - Clear warning about permanent deletion
   - Distinct button styling for destructive action
   - Easy way to cancel the operation

2. **Feedback**
   - Toast notifications for success/failure
   - Visual indication of cleared chat
   - Clear error messages when something goes wrong

## Performance

1. **Database**
   - Use efficient deletion queries
   - Consider batch processing for large message counts
   - Index relevant columns

2. **Client**
   - Optimistic UI updates
   - Handle loading states
   - Prevent multiple deletion requests

## Accessibility

1. **Keyboard Navigation**
   - Ensure dialog is keyboard accessible
   - Proper focus management
   - Clear focus indicators

2. **Screen Readers**
   - Descriptive ARIA labels
   - Clear announcement of actions
   - Proper heading structure

## Future Considerations

1. **Features**
   - Selective message deletion
   - Export chat before deletion
   - Undo functionality (time window)

2. **Maintenance**
   - Monitor database performance
   - Track usage patterns
   - Regular security audits 