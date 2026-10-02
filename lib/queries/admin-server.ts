import { createClient } from "@/lib/supabase/server";

/** Mirrors the middleware's own check — pages call this too, rather than
 * trusting that middleware already ran, per the "never rely only on
 * hiding a link" rule. */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_admin");
  if (error) return false;
  return Boolean(data);
}

export type DashboardStats = {
  orderCounts: Record<string, number>;
  revenueCents: number;
  lowStockProducts: { id: string; name: string; stockQty: number }[];
};

const LOW_STOCK_THRESHOLD = 5;

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  const [{ data: orders }, { data: lowStock }] = await Promise.all([
    supabase.from("orders").select("status, total_cents, payment_status"),
    supabase
      .from("products")
      .select("id, name, stock_qty")
      .lt("stock_qty", LOW_STOCK_THRESHOLD)
      .order("stock_qty", { ascending: true }),
  ]);

  const orderCounts: Record<string, number> = {};
  let revenueCents = 0;
  for (const o of orders ?? []) {
    orderCounts[o.status] = (orderCounts[o.status] ?? 0) + 1;
    if (o.payment_status === "test_paid" || o.payment_status === "paid") {
      revenueCents += o.total_cents;
    }
  }

  return {
    orderCounts,
    revenueCents,
    lowStockProducts: (lowStock ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      stockQty: p.stock_qty,
    })),
  };
}
