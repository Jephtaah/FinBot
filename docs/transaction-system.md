# Complete Transaction Management System

## Overview

This transaction management system provides full CRUD functionality for financial transactions with rich text notes, slug-based routing, and TipTap integration. Built with Next.js 15, Supabase, and TypeScript.

## Database Schema

### Transactions Table

```sql
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  slug text not null,
  type transaction_type not null, -- 'income' | 'expense'
  amount numeric(12,2) not null check (amount > 0),
  category text not null,
  notes jsonb default '{}',
  date date not null,
  receipt_url text,
  source text default 'manual' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  
  unique(user_id, slug)
);
```

### Key Features

- **Auto-generated slugs**: Slugs are automatically generated from transaction titles
- **User isolation**: All transactions are scoped by `user_id` with RLS policies
- **Rich notes**: JSONB field stores TipTap editor content
- **Type safety**: Enum type for income/expense classification

## Server Actions (CRUD)

Located in `lib/actions/transactions.ts`:

### Core Functions

- `createTransaction(data)` - Creates new transaction with auto-generated slug
- `getTransactionBySlug(slug)` - Retrieves transaction by slug for current user
- `getUserTransactions()` - Gets all transactions for current user (sorted by date)
- `updateTransaction(slug, updates)` - Updates transaction by slug
- `deleteTransaction(slug)` - Deletes transaction by slug
- `getTransactionStats()` - Returns aggregated statistics

### Validation

All inputs are validated using Zod schemas defined in `lib/validations/transaction.ts`.

## Routing Structure

### Pages

- `/dashboard/transactions` - Main transactions list with statistics
- `/dashboard/transactions/new` - Create new transaction form
- `/dashboard/transactions/[slug]` - View individual transaction details
- `/dashboard/transactions/[slug]/edit` - Edit transaction form

### Slug-Based Navigation

Each transaction is accessible via its unique slug (e.g., `/transactions/coffee-march`). Slugs are:
- Auto-generated from transaction titles
- URL-friendly (lowercase, hyphenated)
- Unique per user
- Updated when title changes

## TipTap Integration

### Rich Text Editor Component

Located in `components/ui/rich-text-editor.tsx`:

**Features:**
- Bubble menu with formatting options
- Bold, italic, headings (H1-H3)
- Bullet and ordered lists
- Link insertion/removal
- JSON content storage

**Bubble Menu Tools:**
- Text formatting (bold, italic)
- Headings (H1, H2, H3)
- Lists (bullet, numbered)
- Links (add/remove)

### Notes Storage

Transaction notes are stored as JSONB in the database, allowing for:
- Rich formatting preservation
- Efficient querying
- Future extensibility

## Authentication & Security

### Row Level Security (RLS)

All transactions are protected by RLS policies:

```sql
-- Users can only view their own transactions
create policy "users can view their own transactions" 
on public.transactions 
for select 
to authenticated 
using ( (select auth.uid()) = user_id );

-- Similar policies for insert, update, delete
```

### User Scoping

All server actions automatically:
- Verify user authentication
- Scope operations to current user
- Redirect to login if unauthenticated

## Components

### Core Components

1. **TransactionForm** (`components/forms/transaction-form.tsx`)
   - Handles both create and edit modes
   - Form validation with Zod
   - TipTap integration for notes
   - Server action integration

2. **TransactionCard** (`components/transaction-card.tsx`)
   - Displays transaction summary
   - Clickable navigation to details
   - Optional action buttons (edit/delete)

3. **RichTextEditor** (`components/ui/rich-text-editor.tsx`)
   - TipTap wrapper component
   - Bubble menu integration
   - Read-only mode support

### UI Components

- `Badge` - Status indicators
- `Select` - Dropdown selections (Radix UI)
- Standard Shadcn components (Button, Card, Input, etc.)

## Type Safety

### Generated Types

Updated `types/supabase.ts` includes:
- Transaction table types
- Enum types for transaction_type
- Insert/Update type variants

### Convenient Aliases

```typescript
export type Transaction = SupabaseDatabase['public']['Tables']['transactions']['Row']
export type TransactionInsert = SupabaseDatabase['public']['Tables']['transactions']['Insert']
export type TransactionUpdate = SupabaseDatabase['public']['Tables']['transactions']['Update']
```

## Installation & Setup

### Required Packages

```bash
pnpm add zod @tiptap/react @tiptap/starter-kit @tiptap/extension-bubble-menu @tiptap/extension-link @tiptap/pm @radix-ui/react-select
```

### Database Migration

Deploy the migration:
```bash
supabase db push
```

### Type Generation

```bash
supabase gen types typescript --project-id [your-project-id] > types/supabase.ts
```

## Features Summary

✅ **Database Schema** - Complete transactions table with RLS
✅ **CRUD Operations** - Full server actions with validation
✅ **Slug Routing** - Auto-generated, user-scoped slugs
✅ **TipTap Integration** - Rich text editor with bubble menu
✅ **Type Safety** - Full TypeScript integration
✅ **Authentication** - Supabase Auth with user scoping
✅ **Responsive Design** - Mobile-first Tailwind CSS
✅ **Error Handling** - Proper 404 pages and validation
✅ **Performance** - Optimized queries and indexing

## Usage Examples

### Creating a Transaction

```typescript
const result = await createTransaction({
  title: "Coffee at Local Cafe",
  type: "expense",
  amount: 4.50,
  category: "Food & Dining",
  date: "2024-01-15",
  notes: { /* TipTap JSON content */ }
})
```

### Navigation

- List view: `/dashboard/transactions`
- Detail view: `/dashboard/transactions/coffee-at-local-cafe`
- Edit form: `/dashboard/transactions/coffee-at-local-cafe/edit`

The system is now fully functional and ready for production use! 