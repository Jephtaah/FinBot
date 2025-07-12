import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { NextRequest } from 'next/server';
import { ASSISTANTS } from '@/lib/chat/assistants';
import { getFinancialTools } from '@/lib/chat/tools';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, RATE_LIMITS, validateChatMessages } from '@/lib/utils/rate-limit';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    // Verify user authentication first
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }
    
    // Apply rate limiting
    const rateLimitResult = await rateLimit(user.id, RATE_LIMITS.CHAT_API);
    
    if (!rateLimitResult.success) {
      console.log('Rate limit exceeded for user:', user.id);
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded. Please wait before sending more messages.',
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
          retryAfter: rateLimitResult.retryAfter
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60'
          }
        }
      );
    }
    
    // Parse and validate request body
    const body = await req.json();
    let { messages } = body;
    const { assistantId, context } = body;
    
    // Temporary fix: Filter out any empty messages before validation
    if (messages && Array.isArray(messages)) {
      const originalCount = messages.length;
      messages = messages.filter(msg => msg && msg.content && msg.content.trim());
      if (messages.length !== originalCount) {
        console.warn(`🧹 Filtered out ${originalCount - messages.length} empty messages`);
      }
    }
    
    // Debug: Log all messages being received
    console.log('📨 Chat API called at', new Date().toISOString(), {
      count: messages?.length || 0,
      assistantId,
      hasContext: !!context,
      messages: messages?.map((msg, idx) => ({
        index: idx,
        role: msg?.role,
        content: msg?.content?.substring(0, 50) + (msg?.content?.length > 50 ? '...' : ''),
        contentLength: msg?.content?.length || 0,
        hasContent: !!msg?.content,
        isEmpty: !msg?.content || !msg?.content?.trim?.()
      }))
    });
    
    // Validate messages
    const messagesValidation = validateChatMessages(messages);
    if (!messagesValidation.valid) {
      console.error('Message validation failed:', {
        reason: messagesValidation.reason,
        messages: messages?.map(msg => ({ role: msg?.role, content: msg?.content, length: msg?.content?.length }))
      });
      return new Response(
        JSON.stringify({ error: messagesValidation.reason }),
        { status: 400 }
      );
    }
    
    console.log('Chat API called with:', { 
      assistantId, 
      messagesCount: messages?.length, 
      hasContext: !!context,
      userId: user.id,
      remaining: rateLimitResult.remaining 
    });
    
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
    const response = result.toDataStreamResponse();
    
    // Add rate limit headers to successful responses
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
    
    return response;
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { status: 500 }
    );
  }
}