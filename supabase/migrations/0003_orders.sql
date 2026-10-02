-- 0003_orders.sql
-- Phase 5: orders, order items, payments, and the one function that's
-- allowed to create an order. Delivery address is stored flat on the
-- order itself (not a separate addresses table) since nothing yet needs
-- a reusable, multi-address book — that's an easy table to add later
-- without touching anything built in this phase.

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid not null references customers (id),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'test_paid', 'paid', 'failed')),

  subtotal_cents integer not null check (subtotal_cents >= 0),
  delivery_fee_cents integer not null check (delivery_fee_cents >= 0),
  total_cents integer not null check (total_cents >= 0),

  delivery_name text not null,
  delivery_phone text not null,
  delivery_address text not null,
  delivery_city text not null,
  delivery_state text not null,

  -- Lets a retried/duplicated checkout submission return the order that
  -- already exists instead of creating (and charging, and decrementing
  -- stock for) a second one.
  idempotency_key uuid not null unique,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_customer_id_idx on orders (customer_id);

create trigger orders_set_updated_at
  before update on orders
  for each row execute function set_updated_at();

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  product_id uuid not null references products (id),
  -- Snapshots: an order must keep showing what the customer actually
  -- bought and paid, even if the product is later renamed, repriced, or
  -- unpublished.
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  line_total_cents integer not null check (line_total_cents >= 0)
);

create index order_items_order_id_idx on order_items (order_id);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  provider text not null, -- 'test' for now; 'flutterwave' from Phase 8
  reference text not null unique,
  status text not null
    check (status in ('test_paid', 'pending', 'successful', 'failed')),
  amount_cents integer not null check (amount_cents >= 0),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create index payments_order_id_idx on payments (order_id);

-- ─────────────────────────── row level security ────────────────────────
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;

create policy "customers can read their own orders"
  on orders for select
  using (customer_id in (select id from customers where auth_user_id = auth.uid()));

create policy "customers can read items of their own orders"
  on order_items for select
  using (
    order_id in (
      select o.id from orders o
      join customers c on c.id = o.customer_id
      where c.auth_user_id = auth.uid()
    )
  );

create policy "customers can read payments for their own orders"
  on payments for select
  using (
    order_id in (
      select o.id from orders o
      join customers c on c.id = o.customer_id
      where c.auth_user_id = auth.uid()
    )
  );

-- No insert/update/delete policies for the authenticated role on any of
-- these three tables — every write happens inside create_order() below,
-- which runs as the table owner and so isn't subject to RLS itself.

-- ───────────────────────────── create_order() ───────────────────────────
-- The only way an order gets created. Takes product IDs and quantities
-- only — never a price, a subtotal, or a total from the client — and
-- recalculates everything from the live products table inside the same
-- transaction, row-locking each product so two simultaneous checkouts
-- can't both oversell the last item in stock.
create or replace function create_order(
  p_items jsonb,         -- [{ "product_id": "...", "quantity": 2 }, ...]
  p_delivery jsonb,       -- { "name", "phone", "address", "city", "state" }
  p_idempotency_key uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_subtotal integer := 0;
  v_delivery_fee integer;
  v_total integer;
  v_item jsonb;
  v_product record;
  v_existing record;
begin
  -- Replaying a submission with a key we've already used returns the
  -- original order rather than creating a duplicate.
  select id, order_number into v_existing from orders where idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object('order_id', v_existing.id, 'order_number', v_existing.order_number);
  end if;

  select id into v_customer_id from customers where auth_user_id = auth.uid();
  if v_customer_id is null then
    raise exception 'You need to be signed in to check out.';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty.';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select id, name, price_cents, stock_qty, is_published
      into v_product
      from products
      where id = (v_item ->> 'product_id')::uuid
      for update;

    if not found or not v_product.is_published then
      raise exception 'A product in your cart is no longer available.';
    end if;

    if v_product.stock_qty < (v_item ->> 'quantity')::integer then
      raise exception 'Not enough stock for %: only % left.', v_product.name, v_product.stock_qty;
    end if;

    v_subtotal := v_subtotal + v_product.price_cents * (v_item ->> 'quantity')::integer;
  end loop;

  -- Flat delivery-fee rule matching the homepage banner from Phase 2.
  -- Swap this for a real rate table/shipping API whenever that's ready.
  v_delivery_fee := case when v_subtotal >= 5000000 then 0 else 150000 end;
  v_total := v_subtotal + v_delivery_fee;
  v_order_number := 'CG-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 6));

  insert into orders (
    order_number, customer_id, status, payment_status,
    subtotal_cents, delivery_fee_cents, total_cents,
    delivery_name, delivery_phone, delivery_address, delivery_city, delivery_state,
    idempotency_key
  ) values (
    v_order_number, v_customer_id, 'processing', 'test_paid',
    v_subtotal, v_delivery_fee, v_total,
    p_delivery ->> 'name', p_delivery ->> 'phone', p_delivery ->> 'address',
    p_delivery ->> 'city', p_delivery ->> 'state',
    p_idempotency_key
  ) returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select id, name, price_cents into v_product
      from products where id = (v_item ->> 'product_id')::uuid;

    insert into order_items (order_id, product_id, product_name, quantity, unit_price_cents, line_total_cents)
    values (
      v_order_id, v_product.id, v_product.name, (v_item ->> 'quantity')::integer,
      v_product.price_cents, v_product.price_cents * (v_item ->> 'quantity')::integer
    );

    update products set stock_qty = stock_qty - (v_item ->> 'quantity')::integer
      where id = v_product.id;
  end loop;

  -- TEST MODE ONLY: auto-marks the order as paid with no real payment
  -- provider involved. Phase 8 replaces this with a real Flutterwave
  -- charge plus server-side webhook verification before payment_status
  -- is ever set to anything but 'unpaid'.
  insert into payments (order_id, provider, reference, status, amount_cents, verified_at)
  values (v_order_id, 'test', 'TEST-' || v_order_id, 'test_paid', v_total, now());

  return jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number);
end;
$$;

grant execute on function create_order(jsonb, jsonb, uuid) to authenticated;
