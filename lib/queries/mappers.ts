import { Category, Product } from "@/lib/types";

// Shape returned by `.select("*, product_images(url, alt, sort_order), categories(slug)")`
type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_cents: number;
  currency: string;
  sku: string;
  stock_qty: number;
  is_published: boolean;
  categories: { slug: string } | null;
  product_images: { url: string; alt: string; sort_order: number }[];
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
};

export function mapProduct(row: ProductRow): Product {
  const images = [...row.product_images].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    priceCents: row.price_cents,
    currency: "NGN",
    sku: row.sku,
    stockQty: row.stock_qty,
    categorySlug: row.categories?.slug ?? "",
    isPublished: row.is_published,
    images:
      images.length > 0
        ? images.map((i) => ({ url: i.url, alt: i.alt }))
        : [{ url: "https://picsum.photos/seed/placeholder/900/1100", alt: row.name }],
  };
}

export function mapCategory(row: CategoryRow): Category {
  return { id: row.id, name: row.name, slug: row.slug };
}
