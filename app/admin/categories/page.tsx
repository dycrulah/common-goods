import { getAllCategoriesForAdmin } from "@/lib/queries/admin-products";
import CategoryManager from "@/components/admin/CategoryManager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await getAllCategoriesForAdmin();

  return (
    <div>
      <h1 className="font-display text-2xl">Categories</h1>
      <div className="mt-6 max-w-md">
        <CategoryManager categories={categories} />
      </div>
    </div>
  );
}
