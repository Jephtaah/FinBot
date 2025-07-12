-- migration: fix receipt image deletion by removing problematic storage trigger
-- purpose: remove the trigger and function that attempt to use non-existent storage.delete_object function
-- the storage cleanup will be handled by the application layer instead

-- drop the problematic trigger
drop trigger if exists cleanup_receipt_image_storage_trigger on public.receipt_images;

-- drop the problematic function
drop function if exists public.cleanup_receipt_image_storage(); 