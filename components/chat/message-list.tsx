import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Message } from 'ai';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatChatTimestamp, formatFullTimestamp } from '@/lib/utils/time';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 p-4">
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-8">
        <div className="rounded-full bg-primary/10 p-4 ring-1 ring-primary/20">
          <Bot className="h-8 w-8 text-primary" />
        </div>
        <Card className="max-w-md p-6 bg-card/50">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold tracking-tight">Start a conversation</h3>
            <p className="text-sm text-muted-foreground">
              Ask me anything about your finances. I can help analyze your spending patterns, 
              suggest budgeting strategies, or provide investment advice.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message, index) => {
        const isLastMessage = index === messages.length - 1;
        const isUser = message.role === 'user';
        
        return (
          <div
            key={message.id}
            className={cn(
              "group relative flex gap-3 p-4 rounded-lg transition-colors",
              isUser 
                ? "bg-primary/5 dark:bg-primary/10 ml-8 md:ml-12" 
                : "bg-muted/50 dark:bg-muted/20 mr-8 md:mr-12",
              isLastMessage && "mb-4"
            )}
          >
            <div className="flex-shrink-0">
              {isUser ? (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center ring-2 ring-background">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center ring-2 ring-background">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </div>
            
            <div className="flex-1 space-y-2 overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {isUser ? 'You' : 'AI Assistant'}
                </span>
                {message.createdAt && (
                  <span 
                    className="text-xs text-muted-foreground"
                    title={formatFullTimestamp(message.createdAt)}
                  >
                    {formatChatTimestamp(message.createdAt)}
                  </span>
                )}
              </div>
              
              <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                {isUser ? (
                  <p className="text-sm leading-relaxed">{message.content}</p>
                ) : (
                  <div className="text-sm [&>*]:my-3 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    <ReactMarkdown 
                      components={{
                        p: ({ children }) => <p className="text-sm leading-relaxed">{children}</p>,
                        ul: ({ children }) => <ul className="text-sm list-disc pl-4 space-y-2">{children}</ul>,
                        ol: ({ children }) => <ol className="text-sm list-decimal pl-4 space-y-2">{children}</ol>,
                        li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        code: ({ children }) => (
                          <code className="bg-muted px-1.5 py-0.5 rounded-md text-xs font-mono">
                            {children}
                          </code>
                        ),
                        pre: ({ children }) => (
                          <pre className="bg-muted dark:bg-muted/50 p-3 rounded-lg text-xs font-mono overflow-x-auto">
                            {children}
                          </pre>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}