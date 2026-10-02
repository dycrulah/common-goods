"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatNaira } from "@/lib/format";

export default function CartPage() {
  const { itemsWithProduct, setQuantity, removeItem, subtotalCents } = useCart();

  if (itemsWithProduct.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-2xl">Your cart is empty</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Nothing in here yet.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-block rounded-full bg-[var(--color-forest)] px-6 py-3 text-sm text-white"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl">Your cart</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
        <ul className="divide-y border-y">
          {itemsWithProduct.map(({ product, quantity }) => (
            <li key={product.id} className="flex gap-4 py-5">
              <div className="relative h-24 w-20 shrink-0 overflow-hidden bg-[var(--color-card)]">
                <Image
                  src={product.images[0].url}
                  alt={product.images[0].alt}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link href={`/products/${product.slug}`} className="text-sm">
                    {product.name}
                  </Link>
                  <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
                    {formatNaira(product.priceCents)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border">
                    <button
                      aria-label={`Decrease quantity of ${product.name}`}
                      className="h-8 w-8"
                      onClick={() => setQuantity(product.id, quantity - 1)}
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm">{quantity}</span>
                    <button
                      aria-label={`Increase quantity of ${product.name}`}
                      className="h-8 w-8"
                      onClick={() =>
                        setQuantity(
                          product.id,
                          Math.min(product.stockQty, quantity + 1)
                        )
                      }
                    >
                      +
                    </button>
                  </div>
                  <button
                    className="text-sm text-[var(--color-ink-soft)] underline"
                    onClick={() => removeItem(product.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit border p-5">
          <h2 className="text-sm font-medium">Order summary</h2>
          <div className="mt-4 flex justify-between text-sm">
            <span className="text-[var(--color-ink-soft)]">Subtotal</span>
            <span>{formatNaira(subtotalCents)}</span>
          </div>
          <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
            Delivery and final total are calculated at checkout.
          </p>
          <Link
            href="/checkout"
            className="mt-5 block rounded-full bg-[var(--color-forest)] px-6 py-3 text-center text-sm text-white hover:bg-[var(--color-forest-dark)]"
          >
            Checkout
          </Link>
        </aside>
      </div>
    </div>
  );
}
