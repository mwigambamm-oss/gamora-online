-- ============================================
-- GAMORA ONLINE
-- AI Product Image → Color Mapping
-- ============================================

alter table public.products
  add column if not exists image_color_map jsonb
  not null
  default '{}'::jsonb;

comment on column public.products.image_color_map is
'AI-generated mapping between product colors and uploaded product images.';
