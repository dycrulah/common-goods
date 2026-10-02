"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { CartLine, Product } from "@/lib/types";
import { getProductsByIds } from "@/lib/queries/products-client";

type CartContextValue = {
  lines: CartLine[];
  addItem: (productId: string, quantity?: number, product?: Product) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  itemCount: number;
  subtotalCents: number;
  itemsWithProduct: { product: Product; quantity: number }[];
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "common-goods-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [productCache, setProductCache] = useState<Record<string, Product>>({});

  // Local-only convenience for the Phase 2 demo. Once Supabase is wired up
  // in Phase 5, a signed-in customer's cart should live in the carts /
  // cart_items tables instead, with this as a fallback for guests.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // One-time hydration from localStorage on mount — there's no way to
      // read browser storage during the server render, so this has to
      // happen in an effect rather than in useState's initializer.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setLines(JSON.parse(raw));
    } catch {
      // ignore corrupt/missing storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // storage unavailable — cart just won't persist this session
    }
  }, [lines, hydrated]);

  // Fetch product details for any cart line whose product isn't cached yet.
  useEffect(() => {
    const missingIds = lines
      .map((l) => l.productId)
      .filter((id) => !productCache[id]);
    if (missingIds.length === 0) return;

    let cancelled = false;
    getProductsByIds(missingIds).then((fetched) => {
      if (cancelled) return;
      setProductCache((prev) => {
        const next = { ...prev };
        fetched.forEach((p) => (next[p.id] = p));
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [lines, productCache]);

  function addItem(productId: string, quantity = 1, product?: Product) {
    // If the caller already has the product (e.g. the product detail page
    // just fetched it server-side), prime the cache so the cart page
    // doesn't need to re-fetch it over the network.
    if (product) {
      setProductCache((prev) => ({ ...prev, [productId]: product }));
    }
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === productId);
      if (existing) {
        return prev.map((l) =>
          l.productId === productId
            ? { ...l, quantity: l.quantity + quantity }
            : l
        );
      }
      return [...prev, { productId, quantity }];
    });
  }

  function removeItem(productId: string) {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }

  function setQuantity(productId: string, quantity: number) {
    if (quantity <= 0) return removeItem(productId);
    setLines((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, quantity } : l))
    );
  }

  function clear() {
    setLines([]);
  }

  const itemsWithProduct = useMemo(
    () =>
      lines
        .map((l) => {
          const product = productCache[l.productId];
          return product ? { product, quantity: l.quantity } : null;
        })
        .filter((x): x is { product: Product; quantity: number } => x !== null),
    [lines, productCache]
  );

  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  const subtotalCents = itemsWithProduct.reduce(
    (sum, { product, quantity }) => sum + product.priceCents * quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        lines,
        addItem,
        removeItem,
        setQuantity,
        clear,
        itemCount,
        subtotalCents,
        itemsWithProduct,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
