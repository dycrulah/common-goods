import { getAllCategoriesForAdmin } from "@/lib/queries/admin-products";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await getAllCategoriesForAdmin();

  return (
    <div>
      <h1 className="font-display text-2xl">New product</h1>
      <div className="mt-6">
        <ProductForm categories={categories} />
      </div>
    </div>
  );
}
