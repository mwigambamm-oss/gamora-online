-- ============================================
-- GAMORA ONLINE
-- Anonymous / Guest Product Likes
-- ============================================

alter table public.product_likes
  add column if not exists guest_id uuid null;

create index if not exists product_likes_guest_id_idx
  on public.product_likes(guest_id);

create unique index if not exists product_likes_product_guest_unique
  on public.product_likes(product_id, guest_id)
  where guest_id is not null;
