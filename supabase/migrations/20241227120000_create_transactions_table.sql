-- migration: create transactions table with full CRUD functionality
-- purpose: store user transaction data with rich content notes and slug-based routing
-- affected tables: transactions (new)
-- rls: enabled with user-specific access control

-- create type enum for transaction types
create type transaction_type as enum ('income', 'expense');

-- create function to generate slug from title
create or replace function public.generate_slug(title text, user_id uuid)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  base_slug text;
  final_slug text;
  counter integer := 0;
begin
  -- convert title to lowercase, replace spaces/special chars with hyphens
  base_slug := lower(trim(regexp_replace(title, '[^a-zA-Z0-9\s]', '', 'g')));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := trim(base_slug, '-');
  
  -- ensure slug is not empty
  if base_slug = '' then
    base_slug := 'transaction';
  end if;
  
  final_slug := base_slug;
  
  -- check for uniqueness and append counter if needed
  while exists (
    select 1 from public.transactions 
    where slug = final_slug and public.transactions.user_id = generate_slug.user_id
  ) loop
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  end loop;
  
  return final_slug;
end;
$$;

-- create transactions table
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  slug text not null,
  type transaction_type not null,
  amount numeric(12,2) not null check (amount > 0),
  category text not null,
  notes jsonb default '{}',
  date date not null,
  receipt_url text,
  source text default 'manual' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  
  -- ensure slug is unique per user
  unique(user_id, slug)
);

-- enable row level security on transactions table
alter table public.transactions enable row level security;

-- create rls policy for authenticated users to select their own transactions
create policy "users can view their own transactions" 
on public.transactions 
for select 
to authenticated 
using ( (select auth.uid()) = user_id );

-- create rls policy for authenticated users to insert their own transactions
create policy "users can create their own transactions" 
on public.transactions 
for insert 
to authenticated 
with check ( (select auth.uid()) = user_id );

-- create rls policy for authenticated users to update their own transactions
create policy "users can update their own transactions" 
on public.transactions 
for update 
to authenticated 
using ( (select auth.uid()) = user_id )
with check ( (select auth.uid()) = user_id );

-- create rls policy for authenticated users to delete their own transactions
create policy "users can delete their own transactions" 
on public.transactions 
for delete 
to authenticated 
using ( (select auth.uid()) = user_id );

-- create function to auto-generate slug and handle updated_at
create or replace function public.handle_transaction_slug_and_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- generate slug on insert if not provided or on title change
  if tg_op = 'INSERT' or (tg_op = 'UPDATE' and new.title != old.title) then
    new.slug := public.generate_slug(new.title, new.user_id);
  end if;
  
  -- update updated_at timestamp
  if tg_op = 'UPDATE' then
    new.updated_at := now();
  end if;
  
  return new;
end;
$$;

-- create trigger for auto-generating slug and updating timestamp
create trigger handle_transaction_slug_and_updated_at_trigger
  before insert or update on public.transactions
  for each row execute function public.handle_transaction_slug_and_updated_at();

-- add indexes for better performance
create index if not exists transactions_user_id_idx on public.transactions (user_id);
create index if not exists transactions_slug_idx on public.transactions (user_id, slug);
create index if not exists transactions_date_idx on public.transactions (date desc);
create index if not exists transactions_type_idx on public.transactions (type);
create index if not exists transactions_category_idx on public.transactions (category);
create index if not exists transactions_created_at_idx on public.transactions (created_at desc); 