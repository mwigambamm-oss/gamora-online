alter table public.telegram_order_messages
add column if not exists message_text text not null default '';
