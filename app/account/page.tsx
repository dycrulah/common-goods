import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentCustomer } from "@/lib/queries/customers-server";
import { getOrdersForCurrentCustomer } from "@/lib/queries/orders-server";
import { formatNaira } from "@/lib/format";
import SignOutButton from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default async function AccountPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/account/login?next=/account");

  const orders = await getOrdersForCurrentCustomer();

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Your account</h1>
        <SignOutButton />
      </div>

      <div className="mt-8 border p-5">
        <p className="text-sm text-[var(--color-ink-soft)]">Name</p>
        <p className="text-sm">{customer.name || "Not set"}</p>
        <p className="mt-4 text-sm text-[var(--color-ink-soft)]">Email</p>
        <p className="text-sm">{customer.email}</p>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-xl">Your orders</h2>

        {orders.length === 0 ? (
          <>
            <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
              You haven&apos;t placed any orders yet.
            </p>
            <Link href="/products" className="mt-3 inline-block text-sm text-[var(--color-forest)]">
              Start shopping
            </Link>
          </>
        ) : (
          <ul className="mt-4 divide-y border-y text-sm">
            {orders.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-4">
                <div>
                  <Link href={`/account/orders/${o.id}`} className="font-medium">
                    {o.orderNumber}
                  </Link>
                  <p className="mt-1 text-[var(--color-ink-soft)]">
                    {new Date(o.createdAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · {STATUS_LABEL[o.status] ?? o.status}
                  </p>
                </div>
                <span>{formatNaira(o.totalCents)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
