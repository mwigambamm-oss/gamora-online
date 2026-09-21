alter table public.products
add column if not exists size_quantities jsonb not null default '{}'::jsonb;
