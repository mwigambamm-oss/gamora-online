ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS discount_total numeric NOT NULL DEFAULT 0;
