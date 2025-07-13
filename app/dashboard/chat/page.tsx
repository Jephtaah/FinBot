import { AssistantCard } from '@/components/chat/assistant-card';
import { ASSISTANTS } from '@/lib/chat/assistants';

export default function ChatPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Financial AI Assistants</h1>
        <p className="text-muted-foreground">
          Get personalized financial advice from our specialized AI assistants
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        {Object.values(ASSISTANTS).map((assistant) => (
          <AssistantCard 
            key={assistant.id} 
            assistant={assistant} 
            href={`/dashboard/chat/${assistant.id}`}
          />
        ))}
      </div>
    </div>
  );
}