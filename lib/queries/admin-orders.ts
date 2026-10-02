import { createClient } from "@/lib/supabase/server";

export type AdminOrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalCents: number;
  createdAt: string;
  customerEmail: string;
  deliveryName: string;
};

export async function searchOrdersForAdmin(opts: {
  q?: string;
  status?: string;
}): Promise<AdminOrderSummary[]> {
  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select("id, order_number, status, payment_status, total_cents, created_at, delivery_name, customers(email)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (opts.status) query = query.eq("status", opts.status);
  if (opts.q) {
    query = query.or(`order_number.ilike.%${opts.q}%,delivery_name.ilike.%${opts.q}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data.map((o) => ({
    id: o.id,
    orderNumber: o.order_number,
    status: o.status,
    paymentStatus: o.payment_status,
    totalCents: o.total_cents,
    createdAt: o.created_at,
    deliveryName: o.delivery_name,
    customerEmail: (o.customers as unknown as { email: string } | null)?.email ?? "—",
  }));
}

export type AdminOrderDetail = AdminOrderSummary & {
  subtotalCents: number;
  deliveryFeeCents: number;
  deliveryPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryState: string;
  customerId: string;
  paymentReference: string | null;
  items: { productName: string; quantity: number; unitPriceCents: number; lineTotalCents: number }[];
};

export async function getOrderForAdmin(id: string): Promise<AdminOrderDetail | null> {
  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select("*, customers(id, email)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!order) return null;

  const [{ data: items, error: itemsError }, { data: payment }] = await Promise.all([
    supabase
      .from("order_items")
      .select("product_name, quantity, unit_price_cents, line_total_cents")
      .eq("order_id", order.id),
    supabase.from("payments").select("reference").eq("order_id", order.id).maybeSingle(),
  ]);
  if (itemsError) throw itemsError;

  const customer = order.customers as unknown as { id: string; email: string } | null;

  return {
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    paymentStatus: order.payment_status,
    subtotalCents: order.subtotal_cents,
    deliveryFeeCents: order.delivery_fee_cents,
    totalCents: order.total_cents,
    createdAt: order.created_at,
    deliveryName: order.delivery_name,
    deliveryPhone: order.delivery_phone,
    deliveryAddress: order.delivery_address,
    deliveryCity: order.delivery_city,
    deliveryState: order.delivery_state,
    customerId: customer?.id ?? "",
    customerEmail: customer?.email ?? "—",
    paymentReference: payment?.reference ?? null,
    items: (items ?? []).map((i) => ({
      productName: i.product_name,
      quantity: i.quantity,
      unitPriceCents: i.unit_price_cents,
      lineTotalCents: i.line_total_cents,
    })),
  };
}
