import { createClient } from "@/lib/supabase/server";

export type OrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalCents: number;
  createdAt: string;
};

export type OrderDetail = OrderSummary & {
  subtotalCents: number;
  deliveryFeeCents: number;
  delivery: {
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
  };
  items: {
    productName: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }[];
};

export async function getOrdersForCurrentCustomer(): Promise<OrderSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, status, payment_status, total_cents, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return data.map((o) => ({
    id: o.id,
    orderNumber: o.order_number,
    status: o.status,
    paymentStatus: o.payment_status,
    totalCents: o.total_cents,
    createdAt: o.created_at,
  }));
}

/**
 * Looks up by either the internal id or the human-readable order number,
 * since the confirmation page links with the order number but a future
 * admin view will likely use the id. RLS already restricts this to the
 * signed-in customer's own orders — no separate ownership check needed.
 */
export async function getOrderForCurrentCustomer(
  idOrOrderNumber: string
): Promise<OrderDetail | null> {
  const supabase = await createClient();
  const column = idOrOrderNumber.startsWith("CG-") ? "order_number" : "id";

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq(column, idOrOrderNumber)
    .maybeSingle();
  if (error) throw error;
  if (!order) return null;

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("product_name, quantity, unit_price_cents, line_total_cents")
    .eq("order_id", order.id);
  if (itemsError) throw itemsError;

  return {
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    paymentStatus: order.payment_status,
    subtotalCents: order.subtotal_cents,
    deliveryFeeCents: order.delivery_fee_cents,
    totalCents: order.total_cents,
    createdAt: order.created_at,
    delivery: {
      name: order.delivery_name,
      phone: order.delivery_phone,
      address: order.delivery_address,
      city: order.delivery_city,
      state: order.delivery_state,
    },
    items: items.map((i) => ({
      productName: i.product_name,
      quantity: i.quantity,
      unitPriceCents: i.unit_price_cents,
      lineTotalCents: i.line_total_cents,
    })),
  };
}
