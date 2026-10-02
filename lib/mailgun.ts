import "server-only";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type SendEmailResult =
  | { ok: true; messageId: string }
  | { ok: false; configured: false; error: string }
  | { ok: false; configured: true; error: string };

/**
 * Sends one email through Mailgun's HTTP API. Returns a result instead of
 * throwing — a failed or unconfigured email should never crash whatever
 * triggered it (placing an order, signing in). Retries once on a
 * transient failure before giving up.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const from = process.env.MAILGUN_FROM_ADDRESS || `Common Goods <noreply@${domain}>`;
  // EU Mailgun accounts use api.eu.mailgun.net — set MAILGUN_API_BASE_URL
  // if your domain is on the EU region.
  const baseUrl = process.env.MAILGUN_API_BASE_URL || "https://api.mailgun.net";

  if (!apiKey || !domain) {
    return {
      ok: false,
      configured: false,
      error: "Mailgun is not configured yet (MAILGUN_API_KEY / MAILGUN_DOMAIN missing).",
    };
  }

  const body = new URLSearchParams({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
  const auth = Buffer.from(`api:${apiKey}`).toString("base64");

  let lastError = "Unknown error sending email.";
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(`${baseUrl}/v3/${domain}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });

      if (res.ok) {
        const data = (await res.json()) as { id: string };
        return { ok: true, messageId: data.id };
      }
      lastError = `Mailgun responded ${res.status}: ${await res.text()}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Network error contacting Mailgun.";
    }

    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return { ok: false, configured: true, error: lastError };
}
