
## Objective
Build a full-screen streaming chat interface using the AI SDK and OpenAI. The interface includes two assistants—**Income** and **Expenditure**—that provide personalized financial advice based on the user's past conversations and their financial data stored in Supabase.

---

## Functionality Requirements
1. Streamed responses from OpenAI via `ai-sdk`.
2. Markdown formatting using React Markdown.
3. Persistent user chat history scoped per assistant.
4. Only two chat threads:
   - **Income**: Gives guidance on managing and growing income.
   - **Expenditure**: Helps with budgeting and spending control.

---

## Design Requirements

### 1. Chat Overview Page
- Entry point under `/chat`.
- Displays both assistants (**Income** and **Expenditure**) as cards.
- Each card includes:
  - Agent name
  - Brief description
  - Call-to-action (e.g., “Chat” button)

### 2. Dedicated Agent Chat Pages
- Routes: `/chat/income` and `/chat/expenditure`.
- On agent page:
  - Only that assistant's messages are shown.
  - Message input is **fixed at the bottom**.
  - Page auto-scrolls to the latest message on load.
  - Messages grouped and separated by **date**.

### 3. Layout
- Full height using `100vh`.
- Use `ScrollArea` for chat body.
- Override the parent layout if neccessary.

---

## Step 1: Build and Test Chat Flow
- Create routes: `/chat`, `/chat/income`, and `/chat/expenditure`.
- Implement OpenAI streaming with `ai-sdk`.
- Scope assistant responses to each respective chat.
- Ensure messages persist and render using React Markdown.

---

## Step 2: Run and Apply Supabase Migrations
- Use `supabase db push` to deploy schema changes.
- Generate updated TypeScript types:
  ```bash
  supabase gen types typescript --local
  ```
- Ensure chat logic and type-safe components use the generated types from:
  ```ts
  import { Database } from '@/types/supabase';
  type Transaction = Database['public']['Tables']['transactions']['Row'];
  ```

---

## Step 3: Integrate Supabase Transactions and Receipt Images into Agent Context

### Purpose
To allow the AI assistants to deliver **deeply personalized advice**, enrich their context with the user's actual:
- **Transaction history** (`transactions` table)
- **Receipt images** (`receipt_images` table)

---

### Supabase Schema Overview

#### `transactions` table
- Tracks individual financial records.
- Key fields: `amount`, `category`, `type`, `date`, `receipt_url`, `notes`
- Linked to `auth.users` via `user_id`
- Indexed and optimized for filtering by user/date/type

#### `receipt_images` table
- Stores uploaded receipt files tied to specific transactions.
- Key fields: `file_path`, `transaction_id`, `uploaded_at`
- Uses `'receipts'` bucket in Supabase Storage
- Also linked to `auth.users`

---

### Recommended Implementation

#### 1. Fetch Supabase Data
Query recent transactions and receipts:

```ts
const { data: transactions } = await supabase
  .from('transactions')
  .select('id, title, amount, type, category, date')
  .eq('user_id', userId)
  .order('date', { ascending: false })
  .limit(50);

const { data: receipts } = await supabase
  .from('receipt_images')
  .select('file_name, file_path, uploaded_at, transaction_id')
  .eq('user_id', userId)
  .order('uploaded_at', { ascending: false });
```

#### 2. Generate a Summary Object
Structure data to be easily consumable by the AI assistant:

```ts
const summary = {
  totalSpending30Days: calculate30DaySpend(transactions),
  topCategories: getTopCategories(transactions),
  receipts: receipts.map(r => ({
    file_name: r.file_name,
    transaction_id: r.transaction_id,
    uploaded_at: r.uploaded_at
  }))
};
```

#### 3. Inject Into AI SDK Thread Context

```ts
const thread = await createThread({
  context: {
    financialSummary: summary,
    instructions: `Use this summary to provide personalized financial advice.`
  }
});
```

#### 4. Keep Context Fresh
- Refresh summary when:
  - A transaction is added or updated
  - A receipt is uploaded
- Re-generate context or optionally reinitialize the thread

---

### Sample Context Payload

```json
{
  "financialSummary": {
    "totalSpending30Days": 1240.5,
    "topCategories": ["Groceries", "Transport", "Dining"],
    "receipts": [
      {
        "file_name": "receipt-walmart-06-30.jpg",
        "transaction_id": "abc-123",
        "uploaded_at": "2025-06-30T12:00:00Z"
      }
    ]
  }
}
```

---

## Additional Notes & Best Practices

- Use `eq('user_id', user.id)` filtering everywhere to securely scope queries to the authenticated user.
- Consider creating a utility like `getUserFinancialContext(userId)` to centralize logic for context generation.
- Optionally cache context summaries per session to reduce load time.
- Be mindful of token limits in AI requests—truncate or summarize large data if necessary.
- When using Supabase Storage, you can generate temporary URLs to allow the assistant to view receipt images if needed (or describe them via OCR).

✅ With this structure, your assistants can offer highly relevant financial coaching grounded in the user’s real data—making the chat genuinely useful.
