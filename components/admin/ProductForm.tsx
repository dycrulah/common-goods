"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct, ProductInput } from "@/lib/actions/admin-products";
import { Category, Product } from "@/lib/types";

export default function ProductForm({
  categories,
  product,
}: {
  categories: Category[];
  product?: Product;
}) {
  const router = useRouter();
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? (product.priceCents / 100).toString() : "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [stockQty, setStockQty] = useState(product ? product.stockQty.toString() : "0");
  const [categoryId, setCategoryId] = useState(
    categories.find((c) => c.slug === product?.categorySlug)?.id ?? categories[0]?.id ?? ""
  );
  const [isPublished, setIsPublished] = useState(product?.isPublished ?? false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const input: ProductInput = {
      name,
      description,
      priceCents: Math.round(parseFloat(price || "0") * 100),
      sku,
      stockQty: parseInt(stockQty || "0", 10),
      categoryId,
      isPublished,
    };

    const result = product ? await updateProduct(product.id, input) : await createProduct(input);

    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <Field label="Name">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full border bg-transparent px-3 py-2 text-sm"
        />
      </Field>

      <Field label="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full border bg-transparent px-3 py-2 text-sm"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Price (₦)">
          <input
            type="number"
            min="0"
            step="1"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="w-full border bg-transparent px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Stock quantity">
          <input
            type="number"
            min="0"
            step="1"
            value={stockQty}
            onChange={(e) => setStockQty(e.target.value)}
            required
            className="w-full border bg-transparent px-3 py-2 text-sm"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="SKU">
          <input
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            required
            className="w-full border bg-transparent px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Category">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full border bg-transparent px-3 py-2 text-sm"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
        Published (visible on the storefront)
      </label>

      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-[var(--color-forest)] px-6 py-3 text-sm text-white disabled:opacity-60"
      >
        {submitting ? "Saving…" : product ? "Save changes" : "Create product"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="text-[var(--color-ink-soft)]">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
