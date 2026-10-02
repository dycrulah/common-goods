"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/queries/admin-server";
import { ActionResult } from "@/lib/actions/admin-products";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createCategory(name: string): Promise<ActionResult> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "Not authorized." };
  if (!name.trim()) return { ok: false, error: "Category name is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({ name, slug: slugify(name) });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/categories");
  revalidatePath("/products");
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "Not authorized." };

  const supabase = await createClient();
  // Products referencing this category aren't deleted — their
  // category_id just becomes null (see the "on delete set null" in
  // 0001_init.sql), so removing a category never removes products.
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/categories");
  revalidatePath("/products");
  return { ok: true };
}
