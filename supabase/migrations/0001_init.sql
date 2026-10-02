-- 0001_init.sql
-- Phase 3: catalogue tables only (categories, products, product_images).
-- Customers, carts, orders, payments, and admins are added in later
-- migrations when their phases are built, so each migration maps to one
-- phase and stays easy to review.

create extension if not exists "pgcrypto";

-- ───────────────────────────── categories ─────────────────────────────
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- ────────────────────────────── products ──────────────────────────────
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'NGN',
  sku text not null unique,
  stock_qty integer not null default 0 check (stock_qty >= 0),
  category_id uuid references categories (id) on delete set null,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_id_idx on products (category_id);
create index products_is_published_idx on products (is_published);

-- keep updated_at current on every edit
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger products_set_updated_at
  before update on products
  for each row execute function set_updated_at();

-- ────────────────────────── product_images ─────────────────────────────
create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  url text not null,
  alt text not null default '',
  sort_order integer not null default 0
);

create index product_images_product_id_idx on product_images (product_id);

-- ─────────────────────────── row level security ────────────────────────
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;

-- Everyone (including anonymous storefront visitors) can read categories.
create policy "categories are publicly readable"
  on categories for select
  using (true);

-- Only published products are publicly readable. Writing is left with no
-- policy for now — the service role key bypasses RLS, which is what
-- Phase 3's admin product-management code uses; Phase 7 adds a proper
-- authenticated-admin write policy once the admins table exists.
create policy "published products are publicly readable"
  on products for select
  using (is_published = true);

create policy "images of published products are publicly readable"
  on product_images for select
  using (
    exists (
      select 1 from products
      where products.id = product_images.product_id
      and products.is_published = true
    )
  );
