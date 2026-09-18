alter table public.products
  add column if not exists name_sw text not null default '',
  add column if not exists category_sw text not null default '',
  add column if not exists description_sw text not null default '',
  add column if not exists colors_sw jsonb not null default '[]'::jsonb,
  add column if not exists sizes_sw jsonb not null default '[]'::jsonb,
  add column if not exists specifications_sw jsonb not null default '{}'::jsonb;
