grant insert, update, delete
on table public.product_variants
to anon;

grant insert, update, delete
on table public.product_variants
to authenticated;

grant usage, select
on sequence public.product_variants_id_seq
to anon;

grant usage, select
on sequence public.product_variants_id_seq
to authenticated;

notify pgrst, 'reload schema';
