import Link from "next/link";
import { getDashboardStats } from "@/lib/queries/admin-server";
import { formatNaira } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_ORDER = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;
const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();
  const totalOrders = Object.values(stats.orderCounts).reduce((a, b) => a + b, 0);

  return (
    <div>
      <h1 className="font-display text-2xl">Dashboard</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="border p-5">
          <p className="text-sm text-[var(--color-ink-soft)]">Total orders</p>
          <p className="mt-1 font-display text-3xl">{totalOrders}</p>
        </div>
        <div className="border p-5">
          <p className="text-sm text-[var(--color-ink-soft)]">Revenue (paid orders)</p>
          <p className="mt-1 font-display text-3xl">{formatNaira(stats.revenueCents)}</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-medium">Orders by status</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {STATUS_ORDER.map((s) => (
            <Link
              key={s}
              href={`/admin/orders?status=${s}`}
              className="border px-3 py-4 text-center hover:border-[var(--color-forest)]"
            >
              <p className="text-2xl">{stats.orderCounts[s] ?? 0}</p>
              <p className="mt-1 text-xs text-[var(--color-ink-soft)]">{STATUS_LABEL[s]}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-medium">Low stock (under 5 units)</h2>
        {stats.lowStockProducts.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-ink-soft)]">Nothing is running low right now.</p>
        ) : (
          <ul className="mt-3 divide-y border-y text-sm">
            {stats.lowStockProducts.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-3">
                <Link href={`/admin/products/${p.id}`}>{p.name}</Link>
                <span className={p.stockQty === 0 ? "text-red-600" : "text-[var(--color-ink-soft)]"}>
                  {p.stockQty} left
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
