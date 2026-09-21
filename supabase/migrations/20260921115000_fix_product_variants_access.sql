-- Allow the customer-facing app to read product variants.
alter table public.product_variants disable row level security;

grant select on table public.product_variants to anon;
grant select on table public.product_variants to authenticated;

-- Make sure PostgREST can see the table after the migration.
notify pgrst, 'reload schema';
