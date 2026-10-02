"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { addProductImage, removeProductImage } from "@/lib/actions/admin-products";

type ImageRow = { id: string; url: string; alt: string };

export default function ProductImageManager({
  productId,
  images,
}: {
  productId: string;
  images: ImageRow[];
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await addProductImage(productId, url, alt);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setUrl("");
    setAlt("");
    router.refresh();
  }

  async function handleRemove(imageId: string) {
    await removeProductImage(imageId, productId);
    router.refresh();
  }

  return (
    <div>
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((img) => (
            <div key={img.id} className="relative">
              <div className="relative aspect-square overflow-hidden bg-[var(--color-card)]">
                <Image src={img.url} alt={img.alt} fill sizes="150px" className="object-cover" />
              </div>
              <button
                type="button"
                onClick={() => handleRemove(img.id)}
                className="mt-1 text-xs text-red-600 underline"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="block text-[var(--color-ink-soft)]">Image URL</span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            required
            className="mt-1 w-64 border bg-transparent px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="block text-[var(--color-ink-soft)]">Alt text</span>
          <input
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            className="mt-1 w-48 border bg-transparent px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full border px-4 py-2 text-sm hover:border-[var(--color-forest)] disabled:opacity-60"
        >
          {submitting ? "Adding…" : "Add image"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
        Paste a URL for now — uploading files directly to Supabase Storage
        is a natural next step once you want real product photography.
      </p>
    </div>
  );
}
