-- 0004_email_log.sql
-- Phase 6: a record of every email attempt, plus a small change to
-- create_order() so the app can tell a genuinely new order apart from an
-- idempotent replay — that distinction is what stops a retried checkout
-- request from sending a second confirmation email for the same order.

create table email_log (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers (id) on delete cascade,
  -- null for emails not tied to one order, e.g. the welcome email
  order_id uuid references orders (id) on delete cascade,
  type text not null
    check (type in ('welcome', 'order_confirmation', 'payment_confirmation', 'status_update', 'cancellation')),
  status text not null
    check (status in ('sent', 'failed', 'skipped_not_configured')),
  provider_message_id text,
  error text,
  created_at timestamptz not null default now()
);

create index email_log_customer_id_idx on email_log (customer_id);
create index email_log_order_id_idx on email_log (order_id);

alter table email_log enable row level security;

create policy "customers can read their own email log"
  on email_log for select
  using (customer_id in (select id from customers where auth_user_id = auth.uid()));

create policy "customers can insert their own email log"
  on email_log for insert
  with check (customer_id in (select id from customers where auth_user_id = auth.uid()));

-- ───────────────── create_order(): now reports is_new ──────────────────
-- Same function as 0003, with one addition: the returned jsonb includes
-- "is_new" so callers can skip sending a confirmation email when a
-- retried submission just returned an order that already existed.
create or replace function create_order(
  p_items jsonb,
  p_delivery jsonb,
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
  select id, order_number into v_existing from orders where idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object('order_id', v_existing.id, 'order_number', v_existing.order_number, 'is_new', false);
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

  insert into payments (order_id, provider, reference, status, amount_cents, verified_at)
  values (v_order_id, 'test', 'TEST-' || v_order_id, 'test_paid', v_total, now());

  return jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number, 'is_new', true);
end;
$$;

grant execute on function create_order(jsonb, jsonb, uuid) to authenticated;
