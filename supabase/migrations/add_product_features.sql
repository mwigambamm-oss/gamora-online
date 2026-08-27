alter table products
add column if not exists images text[],
add column if not exists colors text[],
add column if not exists sizes text[],
add column if not exists discount integer default 0,
add column if not exists orders_count integer default 0,
add column if not exists rating numeric default 0;
