import { AssistantCard } from '@/components/chat/assistant-card';
import { ASSISTANTS } from '@/lib/chat/assistants';

export default function ChatPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Financial AI Assistants</h1>
        <p className="text-muted-foreground">
          Get personalized financial advice from our specialized AI assistants
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
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