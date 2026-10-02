import { notFound } from "next/navigation";
import { getOrderForAdmin } from "@/lib/queries/admin-orders";
import { formatNaira } from "@/lib/format";
import OrderStatusControl from "@/components/admin/OrderStatusControl";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderForAdmin(id);
  if (!order) notFound();

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">{order.orderNumber}</h1>
        <OrderStatusControl orderId={order.id} status={order.status} />
      </div>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        Placed {new Date(order.createdAt).toLocaleString("en-NG")}
      </p>

      <div className="mt-6 border p-5">
        <ul className="divide-y text-sm">
          {order.items.map((item) => (
            <li key={item.productName} className="flex justify-between py-3">
              <span>
                {item.productName} <span className="text-[var(--color-ink-soft)]">× {item.quantity}</span>
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
            <span>{order.deliveryFeeCents === 0 ? "Free" : formatNaira(order.deliveryFeeCents)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span>{formatNaira(order.totalCents)}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-medium">Customer</h2>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            {order.deliveryName}
            <br />
            {order.customerEmail}
            <br />
            {order.deliveryPhone}
          </p>
        </div>
        <div>
          <h2 className="text-sm font-medium">Delivery address</h2>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            {order.deliveryAddress}
            <br />
            {order.deliveryCity}, {order.deliveryState}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-medium">Payment</h2>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Status: {order.paymentStatus}
          {order.paymentReference && <> · Reference: {order.paymentReference}</>}
        </p>
        {order.paymentStatus === "test_paid" && (
          <p className="mt-1 text-xs text-amber-700">
            Test mode payment — no real charge was made.
          </p>
        )}
      </div>
    </div>
  );
}
