"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/lib/actions/admin-orders";

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

export default function OrderStatusControl({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(next: Status) {
    if (next === status) return;
    setSubmitting(true);
    setError(null);
    const result = await updateOrderStatus(orderId, next);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <select
        value={status}
        onChange={(e) => handleChange(e.target.value as Status)}
        disabled={submitting}
        className="border bg-transparent px-3 py-2 text-sm disabled:opacity-60"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s[0].toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>
      {submitting && <span className="ml-2 text-xs text-[var(--color-ink-soft)]">Saving…</span>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
        Changing to Shipped, Delivered, or Cancelled emails the customer automatically.
      </p>
    </div>
  );
}
