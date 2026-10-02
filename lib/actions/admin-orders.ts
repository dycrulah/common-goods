"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/queries/admin-server";
import { getOrderForAdmin } from "@/lib/queries/admin-orders";
import { orderStatusUpdateEmail, cancellationEmail } from "@/lib/emails/templates";
import { sendAndLogEmail } from "@/lib/emails/send-and-log";
import { ActionResult } from "@/lib/actions/admin-products";

const VALID_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;
type OrderStatus = (typeof VALID_STATUSES)[number];

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<ActionResult> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "Not authorized." };
  if (!VALID_STATUSES.includes(status)) return { ok: false, error: "Invalid status." };

  const supabase = await createClient();
  const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account");

  // Email failures must never undo the status change that already
  // succeeded above — the order's new status is the source of truth.
  try {
    const order = await getOrderForAdmin(orderId);
    if (order && order.customerId) {
      if (status === "cancelled") {
        await sendAndLogEmail({
          customerId: order.customerId,
          orderId: order.id,
          type: "cancellation",
          to: order.customerEmail,
          content: cancellationEmail({ customerName: order.deliveryName, orderNumber: order.orderNumber }),
        });
      } else if (status === "processing" || status === "shipped" || status === "delivered") {
        await sendAndLogEmail({
          customerId: order.customerId,
          orderId: order.id,
          detail: status,
          type: "status_update",
          to: order.customerEmail,
          content: orderStatusUpdateEmail({
            customerName: order.deliveryName,
            orderNumber: order.orderNumber,
            status,
          }),
        });
      }
    }
  } catch (emailError) {
    console.error("[admin] order status email failed:", emailError);
  }

  return { ok: true };
}
