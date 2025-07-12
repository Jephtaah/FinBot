-- Messages table for storing chat history
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  assistant_id text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  metadata jsonb default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.messages enable row level security;

-- RLS Policies for messages
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'messages' 
    and policyname = 'Users can read their own messages'
  ) then
    create policy "Users can read their own messages"
      on messages for select
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'messages' 
    and policyname = 'Users can insert their own messages'
  ) then
    create policy "Users can insert their own messages"
      on messages for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

-- Create function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add trigger to messages table
drop trigger if exists update_messages_updated_at on messages;
create trigger update_messages_updated_at
  before update on messages
  for each row
  execute function update_updated_at_column();

-- Create index for faster queries
create index if not exists messages_user_id_assistant_id_idx 
  on messages(user_id, assistant_id);

-- Create index for chronological ordering
create index if not exists messages_created_at_idx 
  on messages(created_at desc);