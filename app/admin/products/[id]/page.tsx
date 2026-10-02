import { notFound } from "next/navigation";
import { getProductByIdForAdmin, getAllCategoriesForAdmin } from "@/lib/queries/admin-products";
import ProductForm from "@/components/admin/ProductForm";
import ProductImageManager from "@/components/admin/ProductImageManager";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductByIdForAdmin(id),
    getAllCategoriesForAdmin(),
  ]);
  if (!product) notFound();

  // Need the raw image rows (with their own ids) for the manager below —
  // getProductByIdForAdmin only returns url/alt, not the row id needed to
  // delete one.
  const supabase = await createClient();
  const { data: imageRows } = await supabase
    .from("product_images")
    .select("id, url, alt")
    .eq("product_id", id)
    .order("sort_order");

  return (
    <div>
      <h1 className="font-display text-2xl">{product.name}</h1>

      <div className="mt-6">
        <ProductForm categories={categories} product={product} />
      </div>

      <div className="mt-10 max-w-xl">
        <h2 className="text-sm font-medium">Images</h2>
        <div className="mt-3">
          <ProductImageManager productId={id} images={imageRows ?? []} />
        </div>
      </div>
    </div>
  );
}
