"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { formatNaira } from "@/lib/format";
import { placeOrder } from "@/lib/actions/checkout";

type InitialCustomer = { name: string | null; email: string; phone: string | null };

const FREE_DELIVERY_THRESHOLD_CENTS = 5000000; // ₦50,000 — mirrors the Phase 2 promo banner
const FLAT_DELIVERY_FEE_CENTS = 150000; // ₦1,500 placeholder, see create_order() for the real rule

export default function CheckoutForm({ customer }: { customer: InitialCustomer }) {
  const router = useRouter();
  const { itemsWithProduct, subtotalCents, clear } = useCart();
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(customer.name ?? "");
  const [phone, setPhone] = useState(customer.phone ?? "");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("Osun");

  const estimatedDeliveryFee =
    subtotalCents >= FREE_DELIVERY_THRESHOLD_CENTS ? 0 : FLAT_DELIVERY_FEE_CENTS;
  const estimatedTotal = subtotalCents + estimatedDeliveryFee;

  const canSubmit = useMemo(
    () =>
      itemsWithProduct.length > 0 &&
      name.trim() &&
      phone.trim() &&
      address.trim() &&
      city.trim() &&
      state.trim() &&
      !submitting,
    [itemsWithProduct.length, name, phone, address, city, state, submitting]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    const result = await placeOrder({
      items: itemsWithProduct.map(({ product, quantity }) => ({
        productId: product.id,
        quantity,
      })),
      delivery: { name, phone, address, city, state },
      idempotencyKey,
    });

    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    clear();
    router.push(`/checkout/confirmation/${result.orderNumber}`);
  }

  if (itemsWithProduct.length === 0) {
    return (
      <p className="text-sm text-[var(--color-ink-soft)]">
        Your cart is empty — add something before checking out.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <div className="space-y-8">
        <section>
          <h2 className="font-display text-xl">Delivery details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" value={name} onChange={setName} autoComplete="name" />
            <Field label="Phone number" value={phone} onChange={setPhone} autoComplete="tel" />
            <Field
              label="Delivery address"
              value={address}
              onChange={setAddress}
              autoComplete="street-address"
              full
            />
            <Field label="City" value={city} onChange={setCity} autoComplete="address-level2" />
            <Field label="State" value={state} onChange={setState} autoComplete="address-level1" />
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl">Review your order</h2>
          <ul className="mt-4 divide-y border-y text-sm">
            {itemsWithProduct.map(({ product, quantity }) => (
              <li key={product.id} className="flex justify-between py-3">
                <span>
                  {product.name} <span className="text-[var(--color-ink-soft)]">× {quantity}</span>
                </span>
                <span>{formatNaira(product.priceCents * quantity)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <aside className="h-fit border p-5">
        <h2 className="text-sm font-medium">Order summary</h2>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--color-ink-soft)]">Subtotal</span>
            <span>{formatNaira(subtotalCents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-ink-soft)]">Delivery (estimated)</span>
            <span>{estimatedDeliveryFee === 0 ? "Free" : formatNaira(estimatedDeliveryFee)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-medium">
            <span>Total (estimated)</span>
            <span>{formatNaira(estimatedTotal)}</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
          The final total is recalculated on the server when you submit.
        </p>

        <div className="mt-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Test mode — no real payment is taken. Flutterwave checkout arrives
          in Phase 8.
        </div>

        {error && (
          <p className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-5 w-full rounded-full bg-[var(--color-forest)] px-6 py-3 text-sm text-white hover:bg-[var(--color-forest-dark)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Placing order…" : "Place order (test mode)"}
        </button>
      </aside>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  autoComplete,
  full,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  full?: boolean;
}) {
  return (
    <label className={`text-sm ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-[var(--color-ink-soft)]">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required
        className="mt-1 w-full border bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--color-forest)]"
      />
    </label>
  );
}
