"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentCustomer } from "@/lib/queries/customers-server";
import { getOrderForCurrentCustomer } from "@/lib/queries/orders-server";
import { orderConfirmationEmail } from "@/lib/emails/templates";
import { sendAndLogEmail } from "@/lib/emails/send-and-log";

export type PlaceOrderInput = {
  items: { productId: string; quantity: number }[];
  delivery: {
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
  };
  idempotencyKey: string;
};

export type PlaceOrderResult =
  | { ok: true; orderNumber: string }
  | { ok: false; error: string };

export async function placeOrder(
  input: PlaceOrderInput
): Promise<PlaceOrderResult> {
  if (input.items.length === 0) {
    return { ok: false, error: "Your cart is empty." };
  }
  for (const field of ["name", "phone", "address", "city", "state"] as const) {
    if (!input.delivery[field]?.trim()) {
      return { ok: false, error: `Please fill in your ${field}.` };
    }
  }

  const customer = await getCurrentCustomer();
  if (!customer) {
    return { ok: false, error: "You need to be signed in to check out." };
  }

  const supabase = await createClient();

  // Quantities and product IDs only — create_order() looks up real prices
  // and stock itself. Nothing the browser sends here is trusted for money.
  const { data, error } = await supabase.rpc("create_order", {
    p_items: input.items.map((i) => ({
      product_id: i.productId,
      quantity: i.quantity,
    })),
    p_delivery: input.delivery,
    p_idempotency_key: input.idempotencyKey,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const result = data as { order_id: string; order_number: string; is_new: boolean };

  // Only email on a genuinely new order — a retried/duplicated submission
  // returns the same order (is_new: false) and shouldn't re-notify anyone.
  // Email failures are logged but never allowed to fail checkout itself;
  // the order has already been created successfully at this point.
  if (result.is_new) {
    try {
      const order = await getOrderForCurrentCustomer(result.order_number);
      if (order) {
        await sendAndLogEmail({
          customerId: customer.id,
          orderId: order.id,
          type: "order_confirmation",
          to: customer.email,
          content: orderConfirmationEmail({
            customerName: order.delivery.name,
            orderNumber: order.orderNumber,
            items: order.items,
            subtotalCents: order.subtotalCents,
            deliveryFeeCents: order.deliveryFeeCents,
            totalCents: order.totalCents,
          }),
        });
      }
    } catch (emailError) {
      console.error("[checkout] order confirmation email failed:", emailError);
    }
  }

  return { ok: true, orderNumber: result.order_number };
}
