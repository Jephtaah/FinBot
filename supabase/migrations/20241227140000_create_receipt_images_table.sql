-- migration: create receipt_images table for storing transaction receipt images
-- purpose: store receipt images in supabase storage with metadata and proper relationships
-- affected tables: receipt_images (new), storage.buckets (configuration), storage.objects (policy updates)
-- rls: enabled with user-specific access control aligned with transaction ownership

-- create receipt_images table to store metadata about uploaded receipt images
create table if not exists public.receipt_images (
  id uuid default gen_random_uuid() primary key,
  transaction_id uuid references public.transactions(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  file_name text not null,
  file_path text not null, -- full path in storage bucket
  file_size integer, -- file size in bytes
  mime_type text, -- image mime type (image/jpeg, image/png, etc.)
  storage_bucket text default 'receipts' not null,
  uploaded_at timestamptz default now() not null,
  
  -- ensure file_path is unique within bucket
  unique(storage_bucket, file_path)
);

-- enable row level security on receipt_images table
alter table public.receipt_images enable row level security;

-- create rls policy for authenticated users to select their own receipt images
create policy "users can view their own receipt images" 
on public.receipt_images 
for select 
to authenticated 
using ( (select auth.uid()) = user_id );

-- create rls policy for authenticated users to insert their own receipt images
create policy "users can create their own receipt images" 
on public.receipt_images 
for insert 
to authenticated 
with check ( (select auth.uid()) = user_id );

-- create rls policy for authenticated users to update their own receipt images
create policy "users can update their own receipt images" 
on public.receipt_images 
for update 
to authenticated 
using ( (select auth.uid()) = user_id )
with check ( (select auth.uid()) = user_id );

-- create rls policy for authenticated users to delete their own receipt images
create policy "users can delete their own receipt images" 
on public.receipt_images 
for delete 
to authenticated 
using ( (select auth.uid()) = user_id );

-- add indexes for better performance
create index if not exists receipt_images_transaction_id_idx on public.receipt_images (transaction_id);
create index if not exists receipt_images_user_id_idx on public.receipt_images (user_id);
create index if not exists receipt_images_file_path_idx on public.receipt_images (storage_bucket, file_path);
create index if not exists receipt_images_uploaded_at_idx on public.receipt_images (uploaded_at desc);

-- create storage bucket for receipts if it doesn't exist
-- note: this requires the storage extension which is enabled by default in supabase
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts', 
  'receipts', 
  true, -- public bucket for easy access
  5242880, -- 5MB file size limit
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']::text[]
)
on conflict (id) do nothing; -- don't error if bucket already exists

-- create storage policy for authenticated users to select receipt images
-- users can view any receipt image (since bucket is public, but we can restrict this later if needed)
create policy "authenticated users can view receipt images"
on storage.objects
for select
to authenticated
using ( bucket_id = 'receipts' );

-- create storage policy for authenticated users to insert receipt images  
-- users can only upload to their own folder structure (user_id/...)
create policy "users can upload their own receipt images"
on storage.objects
for insert
to authenticated
with check ( 
  bucket_id = 'receipts' 
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- create storage policy for authenticated users to update receipt images
-- users can only update their own receipt images
create policy "users can update their own receipt images"
on storage.objects
for update
to authenticated
using ( 
  bucket_id = 'receipts' 
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check ( 
  bucket_id = 'receipts' 
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- create storage policy for authenticated users to delete receipt images
-- users can only delete their own receipt images  
create policy "users can delete their own receipt images"
on storage.objects
for delete
to authenticated
using ( 
  bucket_id = 'receipts' 
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- create function to automatically set user_id when inserting receipt images
create or replace function public.handle_receipt_image_user_id()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- automatically set user_id from auth context if not provided
  if new.user_id is null then
    new.user_id := (select auth.uid());
  end if;
  
  -- validate that the transaction belongs to the same user
  if not exists (
    select 1 from public.transactions 
    where id = new.transaction_id and user_id = new.user_id
  ) then
    raise exception 'Transaction does not belong to the current user';
  end if;
  
  return new;
end;
$$;

-- create trigger for auto-setting user_id and validation
create trigger handle_receipt_image_user_id_trigger
  before insert or update on public.receipt_images
  for each row execute function public.handle_receipt_image_user_id();

-- Note: Storage cleanup will be handled by the application layer using the Supabase client
-- instead of database triggers, as storage.delete_object() function is not available in triggers 