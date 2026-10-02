"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { Product } from "@/lib/types";

export default function AddToCart({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const outOfStock = product.stockQty <= 0;

  function handleAdd() {
    addItem(product.id, quantity, product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="mt-6 flex items-center gap-3">
      <div className="flex items-center border">
        <button
          type="button"
          aria-label="Decrease quantity"
          className="h-10 w-10"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          disabled={outOfStock}
        >
          −
        </button>
        <span className="w-8 text-center text-sm">{quantity}</span>
        <button
          type="button"
          aria-label="Increase quantity"
          className="h-10 w-10"
          onClick={() => setQuantity((q) => Math.min(product.stockQty, q + 1))}
          disabled={outOfStock}
        >
          +
        </button>
      </div>
      <button
        type="button"
        onClick={handleAdd}
        disabled={outOfStock}
        className="flex-1 rounded-full bg-[var(--color-forest)] px-6 py-3 text-sm text-white hover:bg-[var(--color-forest-dark)] disabled:cursor-not-allowed disabled:bg-[var(--color-ink-soft)]"
      >
        {outOfStock ? "Out of stock" : added ? "Added ✓" : "Add to cart"}
      </button>
    </div>
  );
}
