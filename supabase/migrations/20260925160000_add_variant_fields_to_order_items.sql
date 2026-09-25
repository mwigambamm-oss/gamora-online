alter table public.order_items
  add column if not exists variant_id bigint,
  add column if not exists selected_color text,
  add column if not exists selected_size text;

create index if not exists order_items_variant_id_idx
  on public.order_items(variant_id);

create index if not exists order_items_selected_color_idx
  on public.order_items(selected_color);

create index if not exists order_items_selected_size_idx
  on public.order_items(selected_size);

notify pgrst, 'reload schema';
