-- migration: fix overly broad storage bucket permissions for receipt images
-- purpose: restrict receipt image access to owners only for better security
-- affected: storage.objects policies for receipts bucket
-- security impact: prevents users from accessing other users' receipt images

-- drop the overly broad policy that allows all authenticated users to view any receipt
drop policy if exists "authenticated users can view receipt images" on storage.objects;

-- create new restrictive policy that only allows users to view their own receipt images
-- this policy checks that the file path starts with the user's ID folder
create policy "users can view their own receipt images only"
on storage.objects
for select
to authenticated
using ( 
  bucket_id = 'receipts' 
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- note: the other storage policies (insert, update, delete) were already properly restricted
-- to user-specific folders, so no changes needed for those