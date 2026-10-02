"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { togglePublished, deleteProduct } from "@/lib/actions/admin-products";

export default function ProductRowActions({
  id,
  isPublished,
}: {
  id: string;
  isPublished: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleToggle() {
    setError(null);
    startTransition(async () => {
      const result = await togglePublished(id, !isPublished);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm("Delete this product? This can't be undone.")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteProduct(id);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleToggle}
        disabled={pending}
        className="text-sm text-[var(--color-forest)] underline disabled:opacity-60"
      >
        {isPublished ? "Unpublish" : "Publish"}
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="text-sm text-red-600 underline disabled:opacity-60"
      >
        Delete
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
