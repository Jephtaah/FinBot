# AI Chat Implementation Guide

## Overview
This guide outlines the implementation of an AI-powered chat interface within the FinBot dashboard using the AI SDK and OpenAI. The chat system will feature two specialized financial assistants - Income and Expenditure - that provide personalized advice based on user data and transaction history.

## Architecture

### 1. Component Structure
```
app/
  dashboard/
    chat/
      page.tsx             # Overview page showing both assistants
      [assistant]/         # Dynamic route for each assistant
        page.tsx           # Individual chat interface
    layout.tsx            # Dashboard layout (to be updated)
components/
  chat/
    assistant-card.tsx    # Card component for each assistant
    chat-interface.tsx    # Main chat UI component
    chat-input.tsx       # Message input component
    message-list.tsx     # Message display component
lib/
  chat/
    assistants.ts        # Assistant configurations
    context.ts          # Financial context generation
    messages.ts         # Message handling utilities
types/
  chat.ts              # Type definitions for chat system
```

### 2. Assistant Configurations
```typescript
// lib/chat/assistants.ts

export const ASSISTANTS = {
  income: {
    id: 'income',
    name: 'Income Assistant',
    description: 'Expert guidance on managing and growing your income',
    systemPrompt: `You are a financial income advisor. Your role is to:
      - Analyze income patterns and suggest optimization
      - Provide actionable advice for income growth
      - Focus on career development and side income opportunities
      - Use transaction history to make data-driven recommendations
      Only discuss income-related topics. Redirect expenditure questions to the Expenditure Assistant.`,
  },
  expenditure: {
    id: 'expenditure',
    name: 'Expenditure Assistant',
    description: 'Smart budgeting and spending control advisor',
    systemPrompt: `You are a financial expenditure advisor. Your role is to:
      - Analyze spending patterns and identify areas for optimization
      - Provide practical budgeting advice
      - Suggest ways to reduce unnecessary expenses
      - Use transaction history to make data-driven recommendations
      Only discuss expenditure-related topics. Redirect income questions to the Income Assistant.`,
  }
} as const;
```

## Implementation Steps

### 1. Update Dashboard Sidebar
Add chat navigation to the dashboard sidebar:

```typescript
// components/ui/dashboard-sidebar.tsx

const navigationItems = [
  // ... existing items
  {
    name: 'AI Chat',
    href: '/dashboard/chat',
    icon: MessageSquare,
  },
];
```

### 2. Create Chat Overview Page
```typescript
// app/dashboard/chat/page.tsx

import { AssistantCard } from '@/components/chat/assistant-card';
import { ASSISTANTS } from '@/lib/chat/assistants';

export default function ChatPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Financial AI Assistants</h1>
      <div className="grid md:grid-cols-2 gap-6">
        {Object.values(ASSISTANTS).map((assistant) => (
          <AssistantCard key={assistant.id} assistant={assistant} />
        ))}
      </div>
    </div>
  );
}
```

### 3. Implement Chat Interface
```typescript
// components/chat/chat-interface.tsx

'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { useFinancialContext } from '@/lib/chat/context';

interface ChatInterfaceProps {
  assistantId: keyof typeof ASSISTANTS;
}

export function ChatInterface({ assistantId }: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const context = useFinancialContext();
  
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: {
      assistantId,
      context,
    },
    maxSteps: 5,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, scrollRef.current.scrollHeight);
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <MessageList messages={messages} />
      </ScrollArea>
      <ChatInput
        value={input}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
```

### 4. Create API Route Handler
```typescript
// app/api/chat/route.ts

import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { ASSISTANTS } from '@/lib/chat/assistants';
import { getFinancialTools } from '@/lib/chat/tools';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, assistantId, context } = await req.json();
  
  const assistant = ASSISTANTS[assistantId];
  if (!assistant) {
    return new Response('Invalid assistant ID', { status: 400 });
  }

  const result = streamText({
    model: openai('gpt-4'),
    messages: [
      {
        role: 'system',
        content: assistant.systemPrompt,
      },
      ...messages,
    ],
    tools: getFinancialTools(context),
  });

  return result.toDataStreamResponse();
}
```

### 5. Implement Financial Context
```typescript
// lib/chat/context.ts

import { useUser } from '@/hooks/use-user';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useQuery } from '@tanstack/react-query';
import { groupBy } from '@/lib/utils';
import type { Transaction } from '@/types/database';

function generateFinancialSummary(transactions: Transaction[]) {
  const totalSpending = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
  const byCategory = groupBy(transactions, 'category');
  
  const topCategories = Object.entries(byCategory)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3)
    .map(([category]) => category);

  const monthlySpending = groupBy(transactions, tx => 
    new Date(tx.date).toISOString().slice(0, 7)
  );

  return {
    totalSpending,
    topCategories,
    monthlyTrends: Object.entries(monthlySpending).map(([month, txs]) => ({
      month,
      total: txs.reduce((sum, tx) => sum + Number(tx.amount), 0),
    })),
    recentTransactions: transactions.slice(0, 5),
  };
}

export function useFinancialContext() {
  const { user } = useUser();
  const supabase = createClientComponentClient();

  return useQuery({
    queryKey: ['financial-context', user?.id],
    queryFn: async () => {
      const [transactions, receipts] = await Promise.all([
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(50),
        supabase
          .from('receipt_images')
          .select('*')
          .eq('user_id', user.id)
          .order('uploaded_at', { ascending: false }),
      ]);

      // Generate signed URLs for receipt images
      const receiptsWithUrls = await Promise.all(
        (receipts.data || []).map(async (receipt) => ({
          ...receipt,
          signedUrl: await supabase.storage
            .from('receipts')
            .createSignedUrl(receipt.file_path, 3600), // 1 hour expiry
        }))
      );

      return {
        transactions: transactions.data || [],
        receipts: receiptsWithUrls,
        summary: generateFinancialSummary(transactions.data || []),
      };
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    cacheTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    enabled: !!user,
  });
}
```

## Database Schema and RLS Policies

### Chat History Schema
```sql
-- supabase/migrations/YYYYMMDDHHMMSS_create_chat_history.sql

-- Messages table for storing chat history
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  assistant_id text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  metadata jsonb default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.messages enable row level security;

-- RLS Policies for messages
create policy "Users can read their own messages"
  on messages for select
  using (auth.uid() = user_id);

create policy "Users can insert their own messages"
  on messages for insert
  with check (auth.uid() = user_id);

-- Secure the transactions table
create policy "Users can read their own transactions"
  on transactions for select
  using (auth.uid() = user_id);

-- Secure receipt_images table
create policy "Users can read their own receipt images"
  on receipt_images for select
  using (auth.uid() = user_id);

-- Create function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add trigger to messages table
create trigger update_messages_updated_at
  before update on messages
  for each row
  execute function update_updated_at_column();

-- Create index for faster queries
create index messages_user_id_assistant_id_idx 
  on messages(user_id, assistant_id);
```

### Message Persistence Integration
```typescript
// lib/chat/messages.ts

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Message } from '@/types/chat';

export function useChatHistory(assistantId: string) {
  const supabase = createClientComponentClient();
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['chat-history', assistantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('assistant_id', assistantId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
  });

  const { mutate: saveMessage } = useMutation({
    mutationFn: async (message: Omit<Message, 'id'>) => {
      const { data, error } = await supabase
        .from('messages')
        .insert(message)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['chat-history', assistantId]);
    },
  });

  return {
    messages,
    isLoading,
    saveMessage,
  };
}
```

### Updated Chat Interface with History
```typescript
// components/chat/chat-interface.tsx

'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { useFinancialContext } from '@/lib/chat/context';
import { useChatHistory } from '@/lib/chat/messages';

interface ChatInterfaceProps {
  assistantId: keyof typeof ASSISTANTS;
}

export function ChatInterface({ assistantId }: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const context = useFinancialContext();
  const { messages: historyMessages, saveMessage } = useChatHistory(assistantId);
  
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: {
      assistantId,
      context,
    },
    maxSteps: 5,
    onFinish: async (message) => {
      await saveMessage({
        assistant_id: assistantId,
        role: message.role,
        content: message.content,
      });
    },
    initialMessages: historyMessages,
  });

  // ... rest of the component
}
```

## Receipt Image Integration

### OCR Processing (Optional)
```typescript
// lib/chat/tools.ts

import { tool } from 'ai';
import { z } from 'zod';
import type { FinancialContext } from '@/types/chat';

export function getFinancialTools(context: FinancialContext) {
  return {
    viewReceipt: tool({
      description: 'View details of a specific receipt image',
      parameters: z.object({
        receiptId: z.string().describe('The ID of the receipt to view'),
      }),
      execute: async ({ receiptId }) => {
        const receipt = context.receipts.find(r => r.id === receiptId);
        if (!receipt) return { error: 'Receipt not found' };

        return {
          url: receipt.signedUrl,
          metadata: receipt.metadata, // OCR data if available
          transaction: context.transactions.find(t => t.id === receipt.transaction_id),
        };
      },
    }),
    summarizeReceipts: tool({
      description: 'Get a summary of recent receipts',
      parameters: z.object({
        limit: z.number().optional().describe('Number of receipts to summarize'),
      }),
      execute: async ({ limit = 5 }) => {
        return {
          receipts: context.receipts
            .slice(0, limit)
            .map(r => ({
              store: r.metadata?.store || 'Unknown Store',
              amount: r.metadata?.amount,
              date: r.uploaded_at,
              items: r.metadata?.items || [],
            })),
        };
      },
    }),
  };
}
```

⚠️ **Important Security Notes**

1. **RLS Testing**
   - Always test RLS policies via API calls, not just in Supabase Studio
   - Use different user sessions to verify isolation
   - Test edge cases (e.g., deleted users, revoked access)

2. **Receipt Image Security**
   - Signed URLs expire after 1 hour
   - Validate file types and sizes server-side
   - Consider implementing watermarking for sensitive documents

3. **Data Privacy**
   - Sanitize transaction data before sending to OpenAI
   - Implement rate limiting per user
   - Log all AI interactions for audit purposes

## Security Considerations

1. **Authentication**
   - All chat routes must be protected behind authentication
   - Use RLS policies to ensure users can only access their own data
   - Validate user session in API routes

2. **Data Privacy**
   - Never expose sensitive financial data in client-side code
   - Sanitize all user inputs before processing
   - Use HTTPS for all API calls
   - Implement rate limiting on chat endpoints

3. **OpenAI Configuration**
   - Store API keys in environment variables
   - Use organization ID if available
   - Implement proper error handling for API limits

## Error Handling

1. **Client-Side**
```typescript
export function useChatWithErrorHandling(props: UseChatProps) {
  const { messages, error, ...rest } = useChat(props);

  useEffect(() => {
    if (error) {
      toast.error('Failed to send message. Please try again.');
      console.error('Chat error:', error);
    }
  }, [error]);

  return { messages, error, ...rest };
}
```

2. **Server-Side**
```typescript
export async function POST(req: Request) {
  try {
    // ... existing code ...
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { status: 500 }
    );
  }
}
```

## Performance Optimization

1. **Message Caching**
   - Cache chat history using React Query
   - Implement infinite scrolling for long chat histories
   - Use optimistic updates for better UX

2. **Context Management**
   - Cache financial context with appropriate invalidation
   - Implement background refresh for context data
   - Use incremental loading for large datasets

3. **UI Optimization**
   - Virtualize message list for better performance
   - Implement progressive loading for images
   - Use React Suspense boundaries

## Testing Strategy

1. **Unit Tests**
   - Test individual chat components
   - Validate message formatting
   - Test context generation logic

2. **Integration Tests**
   - Test chat flow end-to-end
   - Verify authentication integration
   - Test error handling scenarios

3. **E2E Tests**
   - Test full chat experience
   - Verify data persistence
   - Test cross-browser compatibility

## Next Steps

1. Implement the chat interface following this guide
2. Add necessary database migrations for chat history
3. Set up OpenAI API keys in environment
4. Add chat option to dashboard sidebar
5. Test the implementation thoroughly
6. Monitor initial user feedback and usage patterns

## Resources

- [AI SDK Documentation](https://ai-sdk.dev/docs/getting-started/nextjs-app-router)
- [OpenAI API Documentation](https://platform.openai.com/docs/guides/agents)
- [OpenAI Best Practices](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf)

## Type Definitions

### Base Types
```typescript
// types/chat.ts

import type { Database } from './database';

// Re-export base transaction type from database types
export type Transaction = Database['public']['Tables']['transactions']['Row'];

export interface Message {
  id?: string;
  user_id: string;
  assistant_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface Receipt {
  id: string;
  file_name: string;
  file_path: string;
  signedUrl: string;
  transaction_id?: string;
  metadata?: {
    store?: string;
    amount?: number;
    items?: Array<{
      name: string;
      price: number;
      quantity?: number;
    }>;
    date?: string;
  };
  uploaded_at: string;
}

export interface FinancialSummary {
  totalSpending: number;
  topCategories: string[];
  monthlyTrends: Array<{
    month: string;
    total: number;
  }>;
  recentTransactions: Transaction[];
}

export interface FinancialContext {
  transactions: Transaction[];
  receipts: Receipt[];
  summary: FinancialSummary;
}

// Assistant-specific types
export interface Assistant {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
}

export type AssistantId = 'income' | 'expenditure';
```

### Chat History Hydration
```typescript
// app/dashboard/chat/[assistant]/page.tsx

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ChatInterface } from '@/components/chat/chat-interface';
import type { Message, AssistantId } from '@/types/chat';

interface ChatPageProps {
  params: {
    assistant: AssistantId;
  };
}

async function getChatHistory(assistantId: string, userId: string) {
  const supabase = createServerComponentClient({ cookies });
  
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('assistant_id', assistantId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  return messages as Message[];
}

export default async function ChatPage({ params }: ChatPageProps) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/auth/login');
  }

  const initialMessages = await getChatHistory(
    params.assistant,
    session.user.id
  );

  return (
    <ChatInterface 
      assistantId={params.assistant} 
      initialMessages={initialMessages}
    />
  );
}
```

### Updated Chat Interface
```typescript
// components/chat/chat-interface.tsx

interface ChatInterfaceProps {
  assistantId: AssistantId;
  initialMessages: Message[];
}

export function ChatInterface({ 
  assistantId, 
  initialMessages 
}: ChatInterfaceProps) {
  const { messages, saveMessage } = useChatHistory(assistantId);
  const context = useFinancialContext();
  
  const { messages: chatMessages, ...chatProps } = useChat({
    api: '/api/chat',
    body: {
      assistantId,
      context,
    },
    initialMessages,
    onFinish: async (message) => {
      await saveMessage({
        assistant_id: assistantId,
        role: message.role,
        content: message.content,
      });
    },
  });

  // ... rest of component
}
```

## Advanced Considerations

### Supabase Edge Functions for Context Generation

For enhanced security and performance, consider moving sensitive operations to Supabase Edge Functions:

```typescript
// supabase/functions/generate-context/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

interface ContextResponse {
  transactions: any[];
  receipts: any[];
  summary: any;
}

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Verify auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.split(' ')[1] ?? ''
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // Fetch data
    const [transactions, receipts] = await Promise.all([
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(50),
      supabase
        .from('receipt_images')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false }),
    ]);

    // Generate signed URLs securely
    const receiptsWithUrls = await Promise.all(
      (receipts.data || []).map(async (receipt) => ({
        ...receipt,
        signedUrl: await supabase.storage
          .from('receipts')
          .createSignedUrl(receipt.file_path, 3600),
      }))
    );

    // Generate summary
    const summary = generateFinancialSummary(transactions.data || []);

    const response: ContextResponse = {
      transactions: transactions.data || [],
      receipts: receiptsWithUrls,
      summary,
    };

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
});
```

Then update the context hook to use the edge function:

```typescript
// lib/chat/context.ts

export function useFinancialContext() {
  const { user } = useUser();
  const supabase = createClientComponentClient();

  return useQuery({
    queryKey: ['financial-context', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<ContextResponse>(
        'generate-context',
        {
          method: 'POST',
        }
      );

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    enabled: !!user,
  });
}
```

This approach provides several benefits:
- Secure generation of signed URLs
- Protected financial calculations
- Reduced client-side processing
- Better error handling and logging
- Ability to add caching at the edge

⚠️ **Important Security Notes**

1. **RLS Testing**
   - Always test RLS policies via API calls, not just in Supabase Studio
   - Use different user sessions to verify isolation
   - Test edge cases (e.g., deleted users, revoked access)

2. **Receipt Image Security**
   - Signed URLs expire after 1 hour
   - Validate file types and sizes server-side
   - Consider implementing watermarking for sensitive documents

3. **Data Privacy**
   - Sanitize transaction data before sending to OpenAI
   - Implement rate limiting per user
   - Log all AI interactions for audit purposes

## Security Considerations

1. **Authentication**
   - All chat routes must be protected behind authentication
   - Use RLS policies to ensure users can only access their own data
   - Validate user session in API routes

2. **Data Privacy**
   - Never expose sensitive financial data in client-side code
   - Sanitize all user inputs before processing
   - Use HTTPS for all API calls
   - Implement rate limiting on chat endpoints

3. **OpenAI Configuration**
   - Store API keys in environment variables
   - Use organization ID if available
   - Implement proper error handling for API limits

## Error Handling

1. **Client-Side**
```typescript
export function useChatWithErrorHandling(props: UseChatProps) {
  const { messages, error, ...rest } = useChat(props);

  useEffect(() => {
    if (error) {
      toast.error('Failed to send message. Please try again.');
      console.error('Chat error:', error);
    }
  }, [error]);

  return { messages, error, ...rest };
}
```

2. **Server-Side**
```typescript
export async function POST(req: Request) {
  try {
    // ... existing code ...
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { status: 500 }
    );
  }
}
```

## Performance Optimization

1. **Message Caching**
   - Cache chat history using React Query
   - Implement infinite scrolling for long chat histories
   - Use optimistic updates for better UX

2. **Context Management**
   - Cache financial context with appropriate invalidation
   - Implement background refresh for context data
   - Use incremental loading for large datasets

3. **UI Optimization**
   - Virtualize message list for better performance
   - Implement progressive loading for images
   - Use React Suspense boundaries

## Testing Strategy

1. **Unit Tests**
   - Test individual chat components
   - Validate message formatting
   - Test context generation logic

2. **Integration Tests**
   - Test chat flow end-to-end
   - Verify authentication integration
   - Test error handling scenarios

3. **E2E Tests**
   - Test full chat experience
   - Verify data persistence
   - Test cross-browser compatibility

## Next Steps

1. Implement the chat interface following this guide
2. Add necessary database migrations for chat history
3. Set up OpenAI API keys in environment
4. Add chat option to dashboard sidebar
5. Test the implementation thoroughly
6. Monitor initial user feedback and usage patterns

## Resources

- [AI SDK Documentation](https://ai-sdk.dev/docs/getting-started/nextjs-app-router)
- [OpenAI API Documentation](https://platform.openai.com/docs/guides/agents)
- [OpenAI Best Practices](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf) 