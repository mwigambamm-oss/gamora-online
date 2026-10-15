alter table public.products add column if not exists videos text[] not null default '{}'::text[];
