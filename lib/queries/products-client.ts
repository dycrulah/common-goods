import { createClient } from "@/lib/supabase/client";
import { mapProduct } from "@/lib/queries/mappers";
import { Product } from "@/lib/types";

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, categories(slug), product_images(url, alt, sort_order)")
    .in("id", ids)
    .eq("is_published", true);
  if (error) throw error;
  return data.map(mapProduct);
}
