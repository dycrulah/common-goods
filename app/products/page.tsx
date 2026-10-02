import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import SortSelect from "@/components/SortSelect";
import { getCategories, searchProducts } from "@/lib/queries/products-server";

const PAGE_SIZE = 8;

type SortKey = "newest" | "price-asc" | "price-desc";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const category = typeof params.category === "string" ? params.category : "";
  const sort = (params.sort as SortKey) || "newest";
  const page = Math.max(1, Number(params.page) || 1);

  const [categories, { products: pageItems, totalPages }] = await Promise.all([
    getCategories(),
    searchProducts({ q, category, sort, page, pageSize: PAGE_SIZE }),
  ]);

  function buildHref(next: Record<string, string | number>) {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (category) sp.set("category", category);
    if (sort) sp.set("sort", sort);
    if (page) sp.set("page", String(page));
    Object.entries(next).forEach(([k, v]) => sp.set(k, String(v)));
    return `/products?${sp.toString()}`;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl">
        {category ? categories.find((c) => c.slug === category)?.name : "All products"}
      </h1>

      <div className="mt-6 flex flex-wrap items-center gap-4 border-y py-4 text-sm">
        <div className="flex flex-wrap gap-3">
          <Link
            href={buildHref({ category: "", page: 1 })}
            className={!category ? "text-[var(--color-forest)]" : "text-[var(--color-ink-soft)]"}
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={buildHref({ category: c.slug, page: 1 })}
              className={
                category === c.slug
                  ? "text-[var(--color-forest)]"
                  : "text-[var(--color-ink-soft)]"
              }
            >
              {c.name}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-[var(--color-ink-soft)]">Sort</span>
          <SortSelect
            defaultValue={sort}
            hidden={[
              ...(q ? [{ name: "q", value: q }] : []),
              ...(category ? [{ name: "category", value: category }] : []),
            ]}
          />
        </div>
      </div>

      {pageItems.length === 0 ? (
        <p className="mt-16 text-center text-[var(--color-ink-soft)]">
          No products match{q ? ` "${q}"` : " your filters"}. Try clearing the
          search or picking a different category.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4">
          {pageItems.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-12 flex justify-center gap-2 text-sm">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={buildHref({ page: n })}
              className={`h-8 w-8 flex items-center justify-center border ${
                n === page ? "border-[var(--color-forest)]" : ""
              }`}
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
