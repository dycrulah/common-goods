import Link from "next/link";
import { Category } from "@/lib/types";

export default function Footer({ categories }: { categories: Category[] }) {
  return (
    <footer className="mt-24 border-t">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <p className="font-display text-lg">Common Goods</p>
            <p className="mt-2 max-w-xs text-sm text-[var(--color-ink-soft)]">
              Well-made things for the kitchen, the desk, and the rest of the
              house. Shipped from Osogbo, Nigeria.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Shop</p>
            <ul className="mt-3 space-y-2 text-sm text-[var(--color-ink-soft)]">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/category/${c.slug}`}>{c.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium">Account</p>
            <ul className="mt-3 space-y-2 text-sm text-[var(--color-ink-soft)]">
              <li><Link href="/account">Your orders</Link></li>
              <li><Link href="/cart">Cart</Link></li>
            </ul>
          </div>
        </div>
        <p className="mt-10 text-xs text-[var(--color-ink-soft)]">
          © {new Date().getFullYear()} Common Goods. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
