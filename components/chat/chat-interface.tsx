'use client';

import { useChat } from 'ai/react';
import { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { useFinancialContext } from '@/lib/chat/context';
import { useChatHistory } from '@/lib/chat/messages';
import { ASSISTANTS } from '@/lib/chat/assistants';
import { TrendingUp, TrendingDown, MoreVertical, ArrowLeft } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-user';
import type { AssistantId } from '@/types/chat';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DeleteChatDialog, ExportChatDialog } from '@/components/ui/alert-dialog';
import { clearChatHistory, fetchChatHistoryForExport } from '@/app/actions/chat';
import { toast } from 'sonner';

interface ChatInterfaceProps {
  assistantId: AssistantId;
}

export function ChatInterface({ assistantId }: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { user, loading: userLoading } = useUser();
  const { data: context, isLoading: contextLoading } = useFinancialContext();
  const { messages: historyMessages, saveMessage, isLoading: isHistoryLoading } = useChatHistory(assistantId);
  const assistant = ASSISTANTS[assistantId];
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Custom submit handler to handle rate limiting
  const handleChatSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate input is not empty
    if (!input || !input.trim()) {
      console.warn('Empty message prevented from being sent');
      return;
    }
    
    try {
      // Call the original submit handler
      await handleSubmit(e);
    } catch (error: any) {
      console.error('Submit error:', error);
      
      // Handle rate limiting errors at the submit level as well
      if (error.status === 429 || (error.message && error.message.includes('Rate limit'))) {
        toast.error('Rate limit reached', {
          description: 'You have reached the limit of 10 messages per hour. Please wait before sending more messages.',
          duration: 6000,
        });
      }
    }
  };

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/chat',
    body: {
      assistantId,
      context: context || null, // Ensure context is explicitly null if undefined
    },
    onRequest: (request) => {
      const requestBody = request.body ? JSON.parse(request.body) : null;
      console.log('🚀 Chat request being sent:', {
        url: request.url,
        method: request.method,
        messagesCount: requestBody?.messages?.length || 0,
        messages: requestBody?.messages?.map((msg, idx) => ({
          index: idx,
          role: msg?.role,
          content: msg?.content?.substring(0, 100) + (msg?.content?.length > 100 ? '...' : ''),
          contentLength: msg?.content?.length || 0,
          isEmpty: !msg?.content || !msg?.content?.trim()
        })) || []
      });
    },
    onResponse: (response) => {
      console.log('✅ Chat response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
    },
    onError: (error) => {
      console.error('❌ Chat error occurred:', error);
    },
    headers: {
      'Content-Type': 'application/json',
    },
    maxSteps: 5,
    initialMessages: historyMessages?.filter(msg => msg.content && msg.content.trim()).map(msg => ({
      id: msg.id || crypto.randomUUID(),
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      createdAt: msg.created_at ? new Date(msg.created_at) : undefined,
    })) || [],
    onAdd: (message) => {
      // Add timestamp to new messages
      if (!message.createdAt) {
        message.createdAt = new Date();
      }
    },
    onFinish: async (message) => {
      console.log('AI response finished, saving assistant message:', message.content.substring(0, 100));
      
      // Don't save empty messages
      if (!message.content || !message.content.trim()) {
        console.warn('⚠️ Skipping save of empty assistant message:', {
          messageId: message.id,
          content: message.content,
          contentType: typeof message.content,
          hasContent: !!message.content
        });
        return;
      }
      
      try {
        await saveMessage({
          user_id: user?.id || '',
          assistant_id: assistantId,
          role: 'assistant',
          content: message.content,
        });
        console.log('Assistant message saved successfully');
        
        // Mark this message as saved
        const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();
        if (lastAssistantMessage?.id) {
          savedMessageIds.current.add(lastAssistantMessage.id);
        }
      } catch (error) {
        console.error('Failed to save assistant message:', error);
      }
    },
    onError: (error) => {
      console.error('Chat error:', error);
      
      // Enhanced rate limit error detection
      const errorMessage = error.message || '';
      const isRateLimit = errorMessage.includes('Rate limit exceeded') || 
                         errorMessage.includes('429') ||
                         errorMessage.includes('Too Many Requests');
      
      if (isRateLimit) {
        toast.error('Rate limit reached', {
          description: 'You have reached the limit of 10 messages per hour. Please wait before sending more messages.',
          duration: 6000,
        });
      } else {
        toast.error('Message failed', {
          description: 'Failed to send your message. Please try again.',
          duration: 4000,
        });
      }
    },
  });

  // Track which messages have been saved to avoid duplicates
  const savedMessageIds = useRef<Set<string>>(new Set());
  
  // Initialize saved message IDs from history when it loads
  useEffect(() => {
    if (historyMessages) {
      historyMessages.forEach(msg => {
        if (msg.id) {
          savedMessageIds.current.add(msg.id);
        }
      });
      console.log('Initialized saved message IDs:', savedMessageIds.current.size);
    }
  }, [historyMessages]);
  
  // Save user messages when they send a new message
  useEffect(() => {
    const userMessages = messages.filter(m => m.role === 'user');
    const initialUserCount = historyMessages?.filter(m => m.role === 'user').length || 0;
    
    // Only save user messages that are new (beyond what was loaded from history)
    if (userMessages.length > initialUserCount) {
      const newUserMessages = userMessages.slice(initialUserCount);
      
      newUserMessages.forEach(userMessage => {
        if (userMessage.id && !savedMessageIds.current.has(userMessage.id)) {
          console.log('New user message detected, saving:', userMessage.content.substring(0, 100));
          
          // Don't save empty messages
          if (!userMessage.content || !userMessage.content.trim()) {
            console.warn('Skipping save of empty user message');
            return;
          }
          
          saveMessage({
            user_id: user?.id || '',
            assistant_id: assistantId,
            role: 'user',
            content: userMessage.content,
          });
          
          savedMessageIds.current.add(userMessage.id);
        }
      });
    }
  }, [messages, historyMessages, saveMessage, assistantId, user?.id]);

  // Debug logging
  console.log('Chat state:', { 
    assistantId,
    messagesCount: messages.length, 
    historyCount: historyMessages?.length || 0,
    isLoading, 
    hasError: !!error,
    assistantName: assistant.name
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, scrollRef.current.scrollHeight);
    }
  }, [messages]);

  const getIcon = (id: string) => {
    switch (id) {
      case 'income':
        return TrendingUp;
      case 'expenditure':
        return TrendingDown;
      default:
        return TrendingUp;
    }
  };

  const Icon = getIcon(assistantId);

  const handleClearChat = async () => {
    // Check if there are any messages to clear
    if (messages.length === 0 && (!historyMessages || historyMessages.length === 0)) {
      setIsDropdownOpen(false);
      toast.error('No messages to clear', {
        description: 'There are no chat messages to delete for this assistant.',
      });
      return;
    }
    
    const result = await clearChatHistory(assistantId);
    
    if (result.success) {
      toast.success('Chat cleared', {
        description: 'All messages have been deleted.',
      });
      // Close the dropdown
      setIsDropdownOpen(false);
      // Clear the messages from the UI
      messages.length = 0;
      // Refresh the query to update the UI
      queryClient.invalidateQueries({ queryKey: ['messages', assistantId] });
    } else {
      toast.error('Error', {
        description: result.error,
      });
    }
  };

  const handleExportChat = async () => {
    const result = await fetchChatHistoryForExport(assistantId);
    
    if (result.success && result.data) {
      // Check if there are any messages to export
      if (result.data.length === 0) {
        setIsDropdownOpen(false);
        toast.error('No messages to export', {
          description: 'There are no chat messages to export for this assistant.',
        });
        return;
      }
      
      // Close the dropdown
      setIsDropdownOpen(false);
      
      // Generate filename with timestamp
      const now = new Date();
      const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `chat-history-${assistantId}-${timestamp}.txt`;
      
      // Format messages as text
      const chatContent = [
        `Chat History with ${assistant.name}`,
        `Exported on: ${now.toLocaleString()}`,
        `Total Messages: ${result.data.length}`,
        '=' + '='.repeat(50),
        '',
        ...result.data.map(message => {
          const timestamp = new Date(message.created_at).toLocaleString();
          const role = message.role === 'user' ? 'You' : assistant.name;
          return `[${timestamp}] ${role}:\n${message.content}\n`;
        })
      ].join('\n');
      
      // Create and download the file
      const blob = new Blob([chatContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Chat history exported', {
        description: 'Your chat history has been downloaded as a text file.',
      });
    } else {
      toast.error('Error', {
        description: result.error || 'Failed to export chat history',
      });
    }
  };

  // Show loading state while user or context is loading
  if (userLoading || contextLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/chat">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to AI Assistants
            </Link>
          </Button>
        </div>
        <Card className="flex flex-col h-[calc(100vh-12rem)] border border-border/50 rounded-lg shadow-none">
          <CardContent className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your financial data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error if user is not authenticated
  if (!user) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/chat">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to AI Assistants
            </Link>
          </Button>
        </div>
        <Card className="flex flex-col h-[calc(100vh-12rem)] border border-border/50 rounded-lg shadow-none">
          <CardContent className="flex-1 flex items-center justify-center p-8">
            <Alert className="max-w-md">
              <AlertDescription>
                Please log in to use the AI assistant.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      {/* Top Navigation - Back Button */}
      <div className="flex items-center">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/chat">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to AI Assistants
          </Link>
        </Button>
      </div>

      {/* Single Responsive Layout */}
      <div className="flex-1 min-h-0">
        {/* Responsive Container - Card on desktop, no card on mobile */}
        <div className="flex flex-col h-[calc(100vh-12rem)] overflow-hidden md:border md:border-border/50 md:rounded-lg md:bg-card md:shadow-none">
          {/* Assistant Header */}
          <div className="border-b border-border/50 md:bg-background/95 md:backdrop-blur px-0 py-4 md:px-8 md:py-6 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 md:gap-2 min-w-0 flex-1">
                <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-primary flex-shrink-0">
                  <Icon className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-base md:text-lg font-semibold tracking-tight truncate">{assistant.name}</h1>
                  <p className="text-sm md:text-sm text-muted-foreground truncate">{assistant.description}</p>
                </div>
              </div>
              <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DeleteChatDialog onConfirm={handleClearChat}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      Clear chat
                    </DropdownMenuItem>
                  </DeleteChatDialog>
                  <ExportChatDialog onConfirm={handleExportChat}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      Export chat
                    </DropdownMenuItem>
                  </ExportChatDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full" ref={scrollRef}>
              <div className="px-0 py-4 md:px-8 md:py-6">
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription className="text-sm">
                      {error.message || 'Failed to send message'}
                    </AlertDescription>
                  </Alert>
                )}
                <MessageList messages={messages} isLoading={isHistoryLoading} />
              </div>
            </ScrollArea>
          </div>

          {/* Context Warning */}
          {!context && (
            <div className="border-t border-border/50 bg-yellow-50 dark:bg-yellow-900/20 px-0 py-4 md:px-8 md:py-4 flex-shrink-0">
              <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
                <AlertDescription className="text-yellow-800 dark:text-yellow-200 text-sm leading-relaxed">
                  ⚠️ Limited financial data available. The AI may provide general advice instead of personalized insights.{' '}
                  <Link href="/dashboard/transactions" className="underline font-medium">
                    Add transactions to get better assistance.
                  </Link>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-border/50 md:bg-background/95 md:backdrop-blur px-0 py-4 md:px-8 md:py-6 flex-shrink-0">
            <ChatInput
              value={input}
              onChange={(value) => handleInputChange({ target: { value } } as React.ChangeEvent<HTMLInputElement>)}
              onSubmit={handleChatSubmit}
              isLoading={isLoading}
              placeholder={`Ask ${assistant.name} anything...`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}