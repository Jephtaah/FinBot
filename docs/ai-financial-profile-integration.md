# AI Financial Profile Integration

## Overview
The AI assistants (Income and Expenditure) have been enhanced with access to the user's financial profile data from the `profiles` table. This integration enables more personalized and context-aware financial advice based on the user's declared monthly income, expected expenses, and savings goals.

## Database Schema
```sql
create table public.profiles (
  id uuid not null,
  email text not null,
  full_name text null,
  avatar_url text null,
  monthly_income numeric(10, 2) null,
  monthly_expense numeric(10, 2) null,
  savings_goal numeric(10, 2) null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
);
```

## AI Assistant Capabilities

### Income Assistant
The Income Assistant now:
- Has access to user's declared monthly income
- Considers monthly expense targets when suggesting income optimization
- Factors in savings goals for income growth advice
- Provides personalized recommendations based on actual financial profile
- Encourages users to set financial targets if missing

### Expenditure Assistant
The Expenditure Assistant now:
- Compares actual spending against monthly expense targets
- Considers income levels when making budget recommendations
- Aligns spending advice with savings goals
- Provides data-driven insights based on transaction history
- Prompts users to complete their financial profile for better advice

## Implementation Details

### Financial Context
The AI system integrates three key financial metrics from the user's profile:
1. `monthly_income`: User's declared monthly income
2. `monthly_expense`: Expected monthly expenses
3. `savings_goal`: Target savings amount

### Enhanced Analysis Tools
The system includes tools for:
- Comparing actual spending against targets
- Calculating potential monthly savings
- Analyzing income-to-expense ratios
- Tracking progress toward savings goals

### Personalization Features
The AI assistants provide:
- Income optimization suggestions based on current income level
- Spending recommendations within declared budget constraints
- Savings strategies aligned with personal goals
- Gap analysis between targets and actual financial behavior

## Usage Examples

### Income Assistant
Example queries:
- "How can I increase my income given my current monthly earnings?"
- "What are realistic income goals based on my expenses?"
- "How can I reach my savings goal faster?"

### Expenditure Assistant
Example queries:
- "Am I spending within my monthly budget?"
- "How do my actual expenses compare to my target?"
- "What adjustments needed to meet my savings goal?"

## Best Practices
1. Always encourage users to set their financial profile data
2. Provide clear context when referencing financial targets
3. Compare actual behavior against declared goals
4. Suggest realistic adjustments based on complete financial picture
5. Maintain privacy and security of sensitive financial data

## Technical Integration
The financial profile data is:
- Fetched alongside transaction history
- Updated in real-time during chat sessions
- Stored securely in the Supabase database
- Protected by Row Level Security policies
- Accessible only to authenticated users 