import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Assistant } from '@/types/chat';

interface AssistantCardProps {
  assistant: Assistant;
  href: string;
}

export function AssistantCard({ assistant, href }: AssistantCardProps) {
  const Icon = assistant.id === 'income' ? TrendingUp : TrendingDown;

  return (
    <Link href={href} className="block">
      <Card className={cn(
        "group relative overflow-hidden transition-colors duration-200",
        "hover:bg-muted/50 active:bg-muted/70",
        "touch-manipulation" // Better touch handling
      )}>
        <div className="relative p-4 sm:p-6 flex items-start gap-3 sm:gap-4">
          <div className={cn(
            "flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full",
            "bg-gradient-to-br from-primary/80 to-primary",
            "ring-2 ring-background"
          )}>
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
          </div>
          
          <div className="space-y-1 min-w-0 flex-1">
            <h3 className="font-semibold tracking-tight text-base sm:text-lg">
              {assistant.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {assistant.description}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}