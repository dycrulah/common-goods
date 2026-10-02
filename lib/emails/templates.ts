import { emailLayout } from "@/lib/emails/layout";
import { formatNaira } from "@/lib/format";

export type EmailContent = { subject: string; html: string; text: string };

type OrderLine = { productName: string; quantity: number; lineTotalCents: number };

type OrderEmailInput = {
  customerName: string;
  orderNumber: string;
  items: OrderLine[];
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
};

function itemsHtml(items: OrderLine[]): string {
  return items
    .map(
      (i) => `
      <tr>
        <td style="padding:6px 0;border-bottom:1px solid #ddd8c9;">${escapeHtml(i.productName)} × ${i.quantity}</td>
        <td style="padding:6px 0;border-bottom:1px solid #ddd8c9;text-align:right;">${formatNaira(i.lineTotalCents)}</td>
      </tr>`
    )
    .join("");
}

function itemsText(items: OrderLine[]): string {
  return items.map((i) => `  ${i.productName} × ${i.quantity} — ${formatNaira(i.lineTotalCents)}`).join("\n");
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export function welcomeEmail(input: { customerName: string }): EmailContent {
  const subject = "Welcome to Common Goods";
  const html = emailLayout(`
    <p>Hi ${escapeHtml(input.customerName)},</p>
    <p>Thanks for creating an account with Common Goods. You're all set — browse the catalogue any time, and your orders and delivery details will be saved here for next time.</p>
  `);
  const text = `Hi ${input.customerName},\n\nThanks for creating an account with Common Goods. You're all set — browse the catalogue any time, and your orders and delivery details will be saved here for next time.`;
  return { subject, html, text };
}

export function orderConfirmationEmail(input: OrderEmailInput): EmailContent {
  const subject = `Order confirmed — ${input.orderNumber}`;
  const html = emailLayout(`
    <p>Hi ${escapeHtml(input.customerName)},</p>
    <p>Your order <strong>${input.orderNumber}</strong> has been placed. Here's what you ordered:</p>
    <table role="presentation" width="100%" style="margin-top:12px;font-size:14px;">
      ${itemsHtml(input.items)}
    </table>
    <table role="presentation" width="100%" style="margin-top:12px;font-size:14px;">
      <tr><td>Subtotal</td><td style="text-align:right;">${formatNaira(input.subtotalCents)}</td></tr>
      <tr><td>Delivery</td><td style="text-align:right;">${
        input.deliveryFeeCents === 0 ? "Free" : formatNaira(input.deliveryFeeCents)
      }</td></tr>
      <tr><td style="font-weight:600;padding-top:6px;">Total</td><td style="text-align:right;font-weight:600;padding-top:6px;">${formatNaira(
        input.totalCents
      )}</td></tr>
    </table>
    <p style="margin-top:20px;">We'll email you again once your order ships. You can also check its status any time by signing in to your account.</p>
  `);
  const text = `Hi ${input.customerName},

Your order ${input.orderNumber} has been placed. Here's what you ordered:

${itemsText(input.items)}

Subtotal: ${formatNaira(input.subtotalCents)}
Delivery: ${input.deliveryFeeCents === 0 ? "Free" : formatNaira(input.deliveryFeeCents)}
Total: ${formatNaira(input.totalCents)}

We'll email you again once your order ships.`;
  return { subject, html, text };
}

/** Ready for Phase 8 — call this once a Flutterwave webhook verifies payment. */
export function paymentConfirmationEmail(input: {
  customerName: string;
  orderNumber: string;
  totalCents: number;
}): EmailContent {
  const subject = `Payment received — ${input.orderNumber}`;
  const html = emailLayout(`
    <p>Hi ${escapeHtml(input.customerName)},</p>
    <p>We've received your payment of <strong>${formatNaira(input.totalCents)}</strong> for order <strong>${
    input.orderNumber
  }</strong>. We're getting it ready.</p>
  `);
  const text = `Hi ${input.customerName},\n\nWe've received your payment of ${formatNaira(
    input.totalCents
  )} for order ${input.orderNumber}. We're getting it ready.`;
  return { subject, html, text };
}

/** Ready for Phase 7 — call this when an admin changes an order's status. */
export function orderStatusUpdateEmail(input: {
  customerName: string;
  orderNumber: string;
  status: "processing" | "shipped" | "delivered";
}): EmailContent {
  const statusLabel = { processing: "being prepared", shipped: "on its way", delivered: "delivered" }[input.status];
  const subject = `Order ${input.orderNumber} is ${input.status}`;
  const html = emailLayout(`
    <p>Hi ${escapeHtml(input.customerName)},</p>
    <p>Your order <strong>${input.orderNumber}</strong> is now <strong>${statusLabel}</strong>.</p>
  `);
  const text = `Hi ${input.customerName},\n\nYour order ${input.orderNumber} is now ${statusLabel}.`;
  return { subject, html, text };
}

/** Ready for Phase 7 — call this when an admin (or a failed payment) cancels an order. */
export function cancellationEmail(input: { customerName: string; orderNumber: string }): EmailContent {
  const subject = `Order ${input.orderNumber} was cancelled`;
  const html = emailLayout(`
    <p>Hi ${escapeHtml(input.customerName)},</p>
    <p>Your order <strong>${input.orderNumber}</strong> has been cancelled. If you weren't expecting this, reply to this email and we'll sort it out.</p>
  `);
  const text = `Hi ${input.customerName},\n\nYour order ${input.orderNumber} has been cancelled. If you weren't expecting this, reply to this email and we'll sort it out.`;
  return { subject, html, text };
}
