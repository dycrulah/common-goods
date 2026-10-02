import Link from "next/link";
import { getAllProductsForAdmin } from "@/lib/queries/admin-products";
import { formatNaira } from "@/lib/format";
import ProductRowActions from "@/components/admin/ProductRowActions";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await getAllProductsForAdmin();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Products</h1>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-[var(--color-forest)] px-5 py-2 text-sm text-white"
        >
          New product
        </Link>
      </div>

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b text-left text-[var(--color-ink-soft)]">
            <th className="py-2 font-normal">Name</th>
            <th className="py-2 font-normal">Price</th>
            <th className="py-2 font-normal">Stock</th>
            <th className="py-2 font-normal">Status</th>
            <th className="py-2 font-normal"></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="py-3">
                <Link href={`/admin/products/${p.id}`}>{p.name}</Link>
                <p className="text-xs text-[var(--color-ink-soft)]">{p.sku}</p>
              </td>
              <td className="py-3">{formatNaira(p.priceCents)}</td>
              <td className="py-3">
                <span className={p.stockQty < 5 ? "text-red-600" : ""}>{p.stockQty}</span>
              </td>
              <td className="py-3">
                {p.isPublished ? (
                  <span className="text-[var(--color-forest)]">Published</span>
                ) : (
                  <span className="text-[var(--color-ink-soft)]">Draft</span>
                )}
              </td>
              <td className="py-3">
                <ProductRowActions id={p.id} isPublished={p.isPublished} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
