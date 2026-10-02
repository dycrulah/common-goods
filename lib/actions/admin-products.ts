"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/queries/admin-server";

export type ActionResult = { ok: true } | { ok: false; error: string };

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export type ProductInput = {
  name: string;
  description: string;
  priceCents: number;
  sku: string;
  stockQty: number;
  categoryId: string;
  isPublished: boolean;
};

export async function createProduct(input: ProductInput): Promise<ActionResult> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "Not authorized." };

  const supabase = await createClient();
  const { error } = await supabase.from("products").insert({
    name: input.name,
    slug: slugify(input.name),
    description: input.description,
    price_cents: input.priceCents,
    sku: input.sku,
    stock_qty: input.stockQty,
    category_id: input.categoryId || null,
    is_published: input.isPublished,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/products");
  return { ok: true };
}

export async function updateProduct(id: string, input: ProductInput): Promise<ActionResult> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "Not authorized." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({
      name: input.name,
      slug: slugify(input.name),
      description: input.description,
      price_cents: input.priceCents,
      sku: input.sku,
      stock_qty: input.stockQty,
      category_id: input.categoryId || null,
      is_published: input.isPublished,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath(`/admin/products/${id}`);
  return { ok: true };
}

export async function togglePublished(id: string, isPublished: boolean): Promise<ActionResult> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "Not authorized." };

  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ is_published: isPublished }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/products");
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "Not authorized." };

  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/products");
  return { ok: true };
}

export async function addProductImage(
  productId: string,
  url: string,
  alt: string
): Promise<ActionResult> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "Not authorized." };
  if (!url.trim()) return { ok: false, error: "Image URL is required." };

  const supabase = await createClient();
  const { count } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  const { error } = await supabase
    .from("product_images")
    .insert({ product_id: productId, url, alt: alt || "", sort_order: count ?? 0 });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/products");
  return { ok: true };
}

export async function removeProductImage(imageId: string, productId: string): Promise<ActionResult> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "Not authorized." };

  const supabase = await createClient();
  const { error } = await supabase.from("product_images").delete().eq("id", imageId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/products");
  return { ok: true };
}
