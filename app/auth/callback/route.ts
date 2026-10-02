import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCustomer } from "@/lib/queries/customers-server";
import { welcomeEmail } from "@/lib/emails/templates";
import { sendAndLogEmail } from "@/lib/emails/send-and-log";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/account";
  const errorDescription = searchParams.get("error_description");

  // The person cancelled, or Google/Supabase returned an auth error.
  if (errorDescription) {
    return NextResponse.redirect(
      `${origin}/account/login?error=${encodeURIComponent(errorDescription)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/account/login?error=${encodeURIComponent(
        "Sign-in link was missing or expired. Please try again."
      )}`
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/account/login?error=${encodeURIComponent(error.message)}`
    );
  }

  // Best-effort welcome email. sendAndLogEmail already skips anyone who's
  // been welcomed before, so this runs safely on every sign-in, not just
  // the first one — and a failure here must never block signing in.
  try {
    const customer = await getCurrentCustomer();
    if (customer) {
      await sendAndLogEmail({
        customerId: customer.id,
        type: "welcome",
        to: customer.email,
        content: welcomeEmail({ customerName: customer.name ?? customer.email }),
      });
    }
  } catch (emailError) {
    console.error("[auth/callback] welcome email failed:", emailError);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
