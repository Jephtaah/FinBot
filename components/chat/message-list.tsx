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
      <div className="space-y-3 md:space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-2 md:gap-3 p-3 md:p-4">
            <Skeleton className="h-7 w-7 md:h-8 md:w-8 rounded-full flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 md:h-4 w-20 md:w-24" />
              <Skeleton className="h-12 md:h-16 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-3 md:space-y-4 py-6 md:py-8 px-4">
        <div className="rounded-full bg-primary/10 p-3 md:p-4 ring-1 ring-primary/20">
          <Bot className="h-6 w-6 md:h-8 md:w-8 text-primary" />
        </div>
        <Card className="max-w-sm md:max-w-md p-4 md:p-6 bg-card/50">
          <div className="space-y-2">
            <h3 className="text-base md:text-lg font-semibold tracking-tight">Start a conversation</h3>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
              Ask me anything about your finances. I can help analyze your spending patterns, 
              suggest budgeting strategies, or provide investment advice.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {messages.map((message, index) => {
        const isLastMessage = index === messages.length - 1;
        const isUser = message.role === 'user';
        
        return (
          <div
            key={message.id}
            className={cn(
              "group relative flex gap-2 md:gap-3 p-3 md:p-4 rounded-lg transition-colors",
              isUser 
                ? "bg-primary/5 dark:bg-primary/10 ml-2 sm:ml-4 md:ml-8" 
                : "bg-muted/50 dark:bg-muted/20 mr-2 sm:mr-4 md:mr-8",
              isLastMessage && "mb-3 md:mb-4"
            )}
          >
            <div className="flex-shrink-0">
              {isUser ? (
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary flex items-center justify-center ring-2 ring-background">
                  <User className="w-3 h-3 md:w-4 md:h-4 text-primary-foreground" />
                </div>
              ) : (
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center ring-2 ring-background">
                  <Bot className="w-3 h-3 md:w-4 md:h-4 text-primary-foreground" />
                </div>
              )}
            </div>
            
            <div className="flex-1 space-y-1 md:space-y-2 overflow-hidden min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs md:text-sm font-medium">
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
                  <p className="text-xs md:text-sm leading-relaxed">{message.content}</p>
                ) : (
                  <div className="text-xs md:text-sm [&>*]:my-2 md:[&>*]:my-3 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    <ReactMarkdown 
                      components={{
                        p: ({ children }) => <p className="text-xs md:text-sm leading-relaxed">{children}</p>,
                        ul: ({ children }) => <ul className="text-xs md:text-sm list-disc pl-3 md:pl-4 space-y-1 md:space-y-2">{children}</ul>,
                        ol: ({ children }) => <ol className="text-xs md:text-sm list-decimal pl-3 md:pl-4 space-y-1 md:space-y-2">{children}</ol>,
                        li: ({ children }) => <li className="text-xs md:text-sm leading-relaxed">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        code: ({ children }) => (
                          <code className="bg-muted px-1 md:px-1.5 py-0.5 rounded-md text-xs font-mono">
                            {children}
                          </code>
                        ),
                        pre: ({ children }) => (
                          <pre className="bg-muted dark:bg-muted/50 p-2 md:p-3 rounded-lg text-xs font-mono overflow-x-auto">
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