import Link from "next/link";
import { searchOrdersForAdmin } from "@/lib/queries/admin-orders";
import { formatNaira } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;
const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const status = typeof params.status === "string" ? params.status : "";

  const orders = await searchOrdersForAdmin({ q, status });

  function hrefFor(next: Record<string, string>) {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (status) sp.set("status", status);
    Object.entries(next).forEach(([k, v]) => (v ? sp.set(k, v) : sp.delete(k)));
    return `/admin/orders?${sp.toString()}`;
  }

  return (
    <div>
      <h1 className="font-display text-2xl">Orders</h1>

      <div className="mt-6 flex flex-wrap items-center gap-4 border-y py-4 text-sm">
        <form action="/admin/orders" className="flex items-center gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Search order number or name"
            className="w-64 border bg-transparent px-3 py-1.5"
          />
          <button type="submit" className="rounded-full border px-4 py-1.5">
            Search
          </button>
        </form>

        <div className="ml-auto flex flex-wrap gap-3">
          <Link href={hrefFor({ status: "" })} className={!status ? "text-[var(--color-forest)]" : ""}>
            All
          </Link>
          {STATUSES.map((s) => (
            <Link key={s} href={hrefFor({ status: s })} className={status === s ? "text-[var(--color-forest)]" : ""}>
              {STATUS_LABEL[s]}
            </Link>
          ))}
        </div>
      </div>

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b text-left text-[var(--color-ink-soft)]">
            <th className="py-2 font-normal">Order</th>
            <th className="py-2 font-normal">Customer</th>
            <th className="py-2 font-normal">Status</th>
            <th className="py-2 font-normal">Total</th>
            <th className="py-2 font-normal">Placed</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b">
              <td className="py-3">
                <Link href={`/admin/orders/${o.id}`}>{o.orderNumber}</Link>
              </td>
              <td className="py-3">
                {o.deliveryName}
                <p className="text-xs text-[var(--color-ink-soft)]">{o.customerEmail}</p>
              </td>
              <td className="py-3">{STATUS_LABEL[o.status] ?? o.status}</td>
              <td className="py-3">{formatNaira(o.totalCents)}</td>
              <td className="py-3 text-[var(--color-ink-soft)]">
                {new Date(o.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {orders.length === 0 && <p className="mt-6 text-sm text-[var(--color-ink-soft)]">No orders match.</p>}
    </div>
  );
}
