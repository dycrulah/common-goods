import { redirect } from "next/navigation";
import Link from "next/link";
import { isCurrentUserAdmin } from "@/lib/queries/admin-server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Middleware already keeps non-admins out of /admin — this check means
  // that protection is never the only thing standing between a
  // non-admin and this layout.
  if (!(await isCurrentUserAdmin())) redirect("/");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center gap-6 border-b pb-4">
        <Link href="/admin" className="font-display text-xl">
          Admin
        </Link>
        <nav className="flex gap-5 text-sm text-[var(--color-ink-soft)]">
          <Link href="/admin" className="hover:text-[var(--color-forest)]">
            Dashboard
          </Link>
          <Link href="/admin/products" className="hover:text-[var(--color-forest)]">
            Products
          </Link>
          <Link href="/admin/categories" className="hover:text-[var(--color-forest)]">
            Categories
          </Link>
          <Link href="/admin/orders" className="hover:text-[var(--color-forest)]">
            Orders
          </Link>
        </nav>
        <Link href="/" className="ml-auto text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-forest)]">
          Back to store
        </Link>
      </div>
      <div className="py-8">{children}</div>
    </div>
  );
}
