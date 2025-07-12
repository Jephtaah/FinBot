import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { NextRequest } from 'next/server';
import { ASSISTANTS } from '@/lib/chat/assistants';
import { getFinancialTools } from '@/lib/chat/tools';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { messages, assistantId, context } = await req.json();
    console.log('Chat API called with:', { assistantId, messagesCount: messages?.length, hasContext: !!context });
    
    // Verify user authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('Auth check:', { 
      hasUser: !!user, 
      userId: user?.id,
      authError: authError?.message 
    });
    
    if (authError || !user) {
      console.log('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }
    
    const assistant = ASSISTANTS[assistantId];
    if (!assistant) {
      console.log('Invalid assistant ID:', assistantId);
      return new Response(
        JSON.stringify({ error: 'Invalid assistant ID' }),
        { status: 400 }
      );
    }
    
    console.log('Using assistant:', assistant.name);

    // Prepare financial context for the assistant
    console.log('Context received:', {
      hasContext: !!context,
      transactionsCount: context?.transactions?.length || 0,
      summarySpending: context?.summary?.totalSpending || 0,
      topCategories: context?.summary?.topCategories || [],
      hasProfile: !!context?.profile,
      profileData: context?.profile,
    });
    
    const contextPrompt = context ? `
      Here's the user's financial context:
      
      PROFILE INFORMATION:
      - Name: ${context.profile?.fullName || 'User'}
      - Email: ${context.profile?.email || 'Not specified'}
      - Monthly Income: ${context.profile?.monthlyIncome ? `$${context.profile.monthlyIncome}` : 'Not specified'}
      - Monthly Expense Target: ${context.profile?.monthlyExpense ? `$${context.profile.monthlyExpense}` : 'Not specified'}
      - Savings Goal: ${context.profile?.savingsGoal ? `$${context.profile.savingsGoal}` : 'Not specified'}
      
      TRANSACTION DATA:
      - Total actual spending: $${context.summary?.totalSpending || 0}
      - Top spending categories: ${context.summary?.topCategories?.join(', ') || 'None'}
      - Recent transactions: ${context.summary?.recentTransactions?.length || 0} available
      - Monthly spending trends: ${context.summary?.monthlyTrends?.length || 0} months of data
      
      KEY INSIGHTS:
      ${context.profile?.monthlyExpense && context.summary?.totalSpending 
        ? `- Budget vs Actual: Target $${context.profile.monthlyExpense}/month, Actual spending $${context.summary.totalSpending} total`
        : '- No budget comparison available (user should set monthly expense target)'}
      ${context.profile?.monthlyIncome && context.profile?.monthlyExpense
        ? `- Expected monthly surplus: $${context.profile.monthlyIncome - context.profile.monthlyExpense}`
        : '- Cannot calculate surplus (income/expense targets needed)'}
      
      Use this information to provide personalized financial advice. If profile data is missing, encourage the user to complete their financial profile for better recommendations.
    ` : 'No financial context available yet. Encourage the user to add transactions and complete their financial profile.';

    console.log('Calling OpenAI with messages:', messages);
    
    const result = streamText({
      model: openai('gpt-4o-mini'),
      messages: [
        {
          role: 'system',
          content: `${assistant.systemPrompt}\n\n${contextPrompt}`,
        },
        ...messages,
      ],
      tools: getFinancialTools(context),
      maxTokens: 1000,
      temperature: 0.7,
    });

    console.log('OpenAI request created, returning stream response');
    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { status: 500 }
    );
  }
}