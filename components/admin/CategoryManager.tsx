"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCategory, deleteCategory } from "@/lib/actions/admin-categories";
import { Category } from "@/lib/types";

export default function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await createCategory(name);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setName("");
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category? Products in it will become uncategorized.")) return;
    await deleteCategory(id);
    router.refresh();
  }

  return (
    <div>
      <ul className="divide-y border-y text-sm">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center justify-between py-3">
            <span>{c.name}</span>
            <button onClick={() => handleDelete(c.id)} className="text-sm text-red-600 underline">
              Delete
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAdd} className="mt-6 flex items-end gap-3">
        <label className="text-sm">
          <span className="block text-[var(--color-ink-soft)]">New category name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 w-56 border bg-transparent px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-[var(--color-forest)] px-5 py-2 text-sm text-white disabled:opacity-60"
        >
          {submitting ? "Adding…" : "Add"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
