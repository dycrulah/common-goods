import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/queries/customers-server";
import { getOrderForCurrentCustomer } from "@/lib/queries/orders-server";
import { formatNaira } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/account/login");

  const { orderNumber } = await params;
  const order = await getOrderForCurrentCustomer(orderNumber);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <p className="text-sm text-[var(--color-forest)]">Order confirmed</p>
      <h1 className="font-display mt-1 text-3xl">Thank you, {order.delivery.name.split(" ")[0]}</h1>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
        Order <span className="font-medium">{order.orderNumber}</span> has
        been placed.
      </p>

      <div className="mt-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Test mode — this order was marked paid automatically for demo
        purposes. No real payment was taken.
      </div>

      <div className="mt-8 border p-5">
        <ul className="divide-y text-sm">
          {order.items.map((item) => (
            <li key={item.productName} className="flex justify-between py-3">
              <span>
                {item.productName}{" "}
                <span className="text-[var(--color-ink-soft)]">× {item.quantity}</span>
              </span>
              <span>{formatNaira(item.lineTotalCents)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--color-ink-soft)]">Subtotal</span>
            <span>{formatNaira(order.subtotalCents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-ink-soft)]">Delivery</span>
            <span>
              {order.deliveryFeeCents === 0 ? "Free" : formatNaira(order.deliveryFeeCents)}
            </span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span>{formatNaira(order.totalCents)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-medium">Delivering to</h2>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          {order.delivery.name} · {order.delivery.phone}
          <br />
          {order.delivery.address}, {order.delivery.city}, {order.delivery.state}
        </p>
      </div>

      <Link
        href="/products"
        className="mt-10 inline-block rounded-full bg-[var(--color-forest)] px-6 py-3 text-sm text-white hover:bg-[var(--color-forest-dark)]"
      >
        Continue shopping
      </Link>
    </div>
  );
}
