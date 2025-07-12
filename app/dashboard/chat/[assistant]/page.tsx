import { notFound } from 'next/navigation';
import { ChatInterface } from '@/components/chat/chat-interface';
import { ASSISTANTS } from '@/lib/chat/assistants';
import type { AssistantId } from '@/types/chat';

interface ChatPageProps {
  params: Promise<{
    assistant: string;
  }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { assistant } = await params;
  const assistantId = assistant as AssistantId;
  
  if (!ASSISTANTS[assistantId]) {
    notFound();
  }

  return <ChatInterface assistantId={assistantId} />;
}

export function generateStaticParams() {
  return Object.keys(ASSISTANTS).map((assistant) => ({
    assistant,
  }));
}