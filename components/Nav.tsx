"use client";

import Link from "next/link";
import { useState } from "react";
import { Category } from "@/lib/types";
import { useCart } from "@/lib/cart-context";

export default function Nav({
  categories,
  isSignedIn,
}: {
  categories: Category[];
  isSignedIn: boolean;
}) {
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  return (
    <header className="sticky top-0 z-40 border-b bg-[var(--color-bg)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-4 sm:px-6">
        <Link href="/" className="font-display text-xl shrink-0">
          Common Goods
        </Link>

        <nav className="hidden gap-5 text-sm md:flex">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="text-[var(--color-ink-soft)] hover:text-[var(--color-forest)]"
            >
              {c.name}
            </Link>
          ))}
        </nav>

        <form
          action="/products"
          className="ml-auto hidden flex-1 max-w-xs items-center gap-2 rounded-full border bg-[var(--color-card)] px-3 py-1.5 sm:flex"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products"
            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--color-ink-soft)]"
          />
        </form>

        <div className="flex items-center gap-4">
          <Link href={isSignedIn ? "/account" : "/account/login"} className="text-sm hidden sm:inline">
            {isSignedIn ? "Account" : "Sign in"}
          </Link>
          <Link href="/cart" className="relative text-sm" aria-label="Cart">
            Cart
            {itemCount > 0 && (
              <span className="absolute -right-3 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-forest)] text-[10px] text-white">
                {itemCount}
              </span>
            )}
          </Link>
          <button
            className="md:hidden"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            ☰
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-3 border-t px-4 py-4 text-sm md:hidden">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              onClick={() => setMenuOpen(false)}
            >
              {c.name}
            </Link>
          ))}
          <Link href={isSignedIn ? "/account" : "/account/login"} onClick={() => setMenuOpen(false)}>
            {isSignedIn ? "Account" : "Sign in"}
          </Link>
        </nav>
      )}
    </header>
  );
}
