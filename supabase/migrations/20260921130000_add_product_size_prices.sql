alter table public.products
add column if not exists size_prices jsonb not null default '{}'::jsonb;
