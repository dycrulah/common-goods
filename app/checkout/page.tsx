import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/queries/customers-server";
import CheckoutForm from "@/components/CheckoutForm";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/account/login?next=/checkout");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl">Checkout</h1>
      <div className="mt-8">
        <CheckoutForm customer={customer} />
      </div>
    </div>
  );
}
