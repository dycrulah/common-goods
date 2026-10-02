import { createClient } from "@/lib/supabase/server";
import { mapProduct, mapCategory } from "@/lib/queries/mappers";
import { Product, Category } from "@/lib/types";

const PRODUCT_SELECT = "*, categories(slug), product_images(url, alt, sort_order)";

export async function getAllProductsForAdmin(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(mapProduct);
}

export async function getProductByIdForAdmin(id: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProduct(data) : null;
}

export async function getAllCategoriesForAdmin(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) throw error;
  return data.map(mapCategory);
}
