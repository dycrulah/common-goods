import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentCustomer } from "@/lib/queries/customers-server";
import { getOrderForCurrentCustomer } from "@/lib/queries/orders-server";
import { formatNaira } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/account/login");

  const { id } = await params;
  // RLS on the orders table already limits this to the signed-in
  // customer's own orders — a stranger's order id just returns null here.
  const order = await getOrderForCurrentCustomer(id);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <Link href="/account" className="text-sm text-[var(--color-ink-soft)]">
        ‹ Your account
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="font-display text-2xl">{order.orderNumber}</h1>
        <span className="text-sm text-[var(--color-ink-soft)]">
          {STATUS_LABEL[order.status] ?? order.status}
        </span>
      </div>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        Placed{" "}
        {new Date(order.createdAt).toLocaleDateString("en-NG", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </p>

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
        <h2 className="text-sm font-medium">Delivered to</h2>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          {order.delivery.name} · {order.delivery.phone}
          <br />
          {order.delivery.address}, {order.delivery.city}, {order.delivery.state}
        </p>
      </div>
    </div>
  );
}
