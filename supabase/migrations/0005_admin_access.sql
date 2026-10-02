-- 0005_admin_access.sql
-- Phase 7: who's allowed into /admin, and what they're allowed to touch
-- once they're there.
--
-- IMPORTANT: there is no sign-up flow for admins, by design. The only way
-- a row ever lands in the admins table is someone with direct database
-- access — you — inserting it manually (Table Editor or SQL Editor).
-- Nothing in the app can grant admin access to anyone. To make your own
-- account an admin after signing in once with Google:
--
--   insert into admins (auth_user_id)
--   select id from auth.users where email = 'you@example.com';

-- A status-update email needs to go out once per status (shipped,
-- delivered, etc.), not just once ever per order — email_log's existing
-- (customer, order, type) dedupe key from Phase 6 can't tell those apart
-- on its own, so it gets one more optional column to distinguish them.
alter table email_log add column detail text;

create table admins (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table admins enable row level security;

-- A security-definer helper so policies elsewhere can check "is the
-- current user an admin?" without each one needing its own subquery (and
-- without the recursion issues a table querying its own RLS'd self can
-- cause) — security definer means this one function's internal query
-- bypasses RLS, while everything that calls the function still goes
-- through normal RLS on whatever table it's checking.
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from admins where auth_user_id = auth.uid());
$$;

create policy "admins can read the admin list"
  on admins for select
  using (is_admin());

grant execute on function is_admin() to authenticated;

-- ──────────────────────── products / categories ────────────────────────
-- The public "published products are readable" policy from 0001 already
-- covers the storefront. These add what the storefront never needed:
-- reading unpublished products, and writing at all.
create policy "admins can read all products"
  on products for select using (is_admin());
create policy "admins can insert products"
  on products for insert with check (is_admin());
create policy "admins can update products"
  on products for update using (is_admin()) with check (is_admin());
create policy "admins can delete products"
  on products for delete using (is_admin());

create policy "admins can write categories"
  on categories for insert with check (is_admin());
create policy "admins can delete categories"
  on categories for delete using (is_admin());

create policy "admins can manage product images"
  on product_images for all using (is_admin()) with check (is_admin());

-- ────────────────────────────── orders ──────────────────────────────────
create policy "admins can read all orders"
  on orders for select using (is_admin());
create policy "admins can update order status"
  on orders for update using (is_admin()) with check (is_admin());
create policy "admins can read all order items"
  on order_items for select using (is_admin());
create policy "admins can read all payments"
  on payments for select using (is_admin());

-- ─────────────────────────────── customers ───────────────────────────────
-- Read-only: admins need a customer's account email to contact them about
-- an order, but never edit a customer's profile directly.
create policy "admins can read all customers"
  on customers for select using (is_admin());
