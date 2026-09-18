-- ============================================
-- GAMORA ONLINE
-- Bilingual Product Specifications
-- English + Tanzanian Swahili
-- ============================================

alter table public.products
  add column if not exists specifications_sw jsonb
  not null
  default '{}'::jsonb;
