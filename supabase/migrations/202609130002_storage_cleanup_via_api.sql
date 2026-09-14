-- Supabase Storage now rejects direct SQL deletion from storage.objects.
-- Managed object deletion must go through the authenticated Storage API, which
-- is performed by the admin client before its image/banner record is removed.
-- Remove the obsolete SQL cleanup triggers so product/banner deletion remains valid.

drop trigger if exists product_image_storage_cleanup on public.product_images;
drop trigger if exists banner_storage_cleanup on public.banners;
drop function if exists public.delete_product_storage_object();
drop function if exists public.delete_banner_storage_object();
