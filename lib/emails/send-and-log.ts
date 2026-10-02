import "server-only";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/mailgun";
import { EmailContent } from "@/lib/emails/templates";

export type EmailType = "welcome" | "order_confirmation" | "payment_confirmation" | "status_update" | "cancellation";

/**
 * Sends one transactional email and records the attempt in email_log.
 * Never throws — a failed or skipped email should never break whatever
 * action triggered it. Checks email_log first so the same (customer,
 * order, type) combination is never sent twice, even if this gets called
 * more than once for the same event.
 */
export async function sendAndLogEmail(params: {
  customerId: string;
  orderId?: string;
  /** Distinguishes repeatable events of the same type — e.g. a
   * status_update email for "shipped" vs. one for "delivered" on the
   * same order, which must each go out once rather than only the first. */
  detail?: string;
  type: EmailType;
  to: string;
  content: EmailContent;
}): Promise<void> {
  const supabase = await createClient();

  let dupeQuery = supabase
    .from("email_log")
    .select("id")
    .eq("customer_id", params.customerId)
    .eq("type", params.type)
    .eq("status", "sent");
  dupeQuery = params.orderId
    ? dupeQuery.eq("order_id", params.orderId)
    : dupeQuery.is("order_id", null);
  dupeQuery = params.detail
    ? dupeQuery.eq("detail", params.detail)
    : dupeQuery.is("detail", null);

  const { data: existing } = await dupeQuery.maybeSingle();
  if (existing) return;

  const result = await sendEmail({
    to: params.to,
    subject: params.content.subject,
    html: params.content.html,
    text: params.content.text,
  });

  const status = result.ok ? "sent" : result.configured ? "failed" : "skipped_not_configured";

  await supabase.from("email_log").insert({
    customer_id: params.customerId,
    order_id: params.orderId ?? null,
    detail: params.detail ?? null,
    type: params.type,
    status,
    provider_message_id: result.ok ? result.messageId : null,
    error: result.ok ? null : result.error,
  });

  if (!result.ok && status === "failed") {
    // Visible in server logs for now; Phase 9 could add alerting on this.
    console.error(`[email] failed to send ${params.type} to ${params.to}: ${result.error}`);
  }
}
