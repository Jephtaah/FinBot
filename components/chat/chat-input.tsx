import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  placeholder = 'Type a message...',
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) form.requestSubmit();
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(e);
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }}
      className="relative flex w-full items-end gap-2"
    >
      <div className="relative flex-1">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className={cn(
            "min-h-[48px] w-full resize-none rounded-md border bg-background px-3 py-2 pr-12",
            "focus-visible:ring-1 focus-visible:ring-offset-0",
            "sm:text-sm",
            isLoading && "opacity-50"
          )}
          disabled={isLoading}
        />
        <div className="absolute right-2 bottom-2">
          <Button 
            type="submit"
            size="icon"
            variant="ghost"
            className={cn(
              "h-8 w-8 rounded-full bg-primary/10 hover:bg-primary/20",
              "transition-opacity",
              (!value.trim() || isLoading) && "opacity-50"
            )}
            disabled={!value.trim() || isLoading}
          >
            <SendHorizontal className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>
    </form>
  );
}