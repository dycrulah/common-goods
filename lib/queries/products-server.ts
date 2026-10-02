import { createClient } from "@/lib/supabase/server";
import { mapProduct, mapCategory } from "@/lib/queries/mappers";
import { Product } from "@/lib/types";

const PRODUCT_SELECT = "*, categories(slug), product_images(url, alt, sort_order)";
// Inner-join variant, needed when filtering by categories.slug — a plain
// left join can't be filtered reliably on the joined table's column.
const PRODUCT_SELECT_CATEGORY_FILTER =
  "*, categories!inner(slug), product_images(url, alt, sort_order)";

export async function getCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) throw error;
  return data.map(mapCategory);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProduct(data) : null;
}

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data.map(mapProduct);
}

type SortKey = "newest" | "price-asc" | "price-desc";

export async function searchProducts(opts: {
  q?: string;
  category?: string;
  sort?: SortKey;
  page?: number;
  pageSize?: number;
}): Promise<{ products: Product[]; totalPages: number }> {
  const supabase = await createClient();
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = opts.pageSize ?? 8;

  let query = supabase
    .from("products")
    .select(
      opts.category ? PRODUCT_SELECT_CATEGORY_FILTER : PRODUCT_SELECT,
      { count: "exact" }
    )
    .eq("is_published", true);

  if (opts.category) {
    query = query.eq("categories.slug", opts.category);
  }
  if (opts.q) {
    query = query.or(`name.ilike.%${opts.q}%,description.ilike.%${opts.q}%`);
  }

  if (opts.sort === "price-asc") query = query.order("price_cents", { ascending: true });
  else if (opts.sort === "price-desc") query = query.order("price_cents", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  query = query.range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    products: data.map(mapProduct),
    totalPages: Math.max(1, Math.ceil((count ?? data.length) / pageSize)),
  };
}
