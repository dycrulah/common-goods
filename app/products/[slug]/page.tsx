import Image from "next/image";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/queries/products-server";
import { formatNaira } from "@/lib/format";
import AddToCart from "@/components/AddToCart";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="relative aspect-[4/5] overflow-hidden bg-[var(--color-card)]">
          <Image
            src={product.images[0].url}
            alt={product.images[0].alt}
            fill
            sizes="(min-width: 768px) 45vw, 90vw"
            className="object-cover"
            priority
          />
        </div>

        <div className="md:pt-4">
          <h1 className="font-display text-3xl">{product.name}</h1>
          <p className="mt-2 text-lg text-[var(--color-ink-soft)]">
            {formatNaira(product.priceCents)}
          </p>

          <p className="mt-6 max-w-md text-sm leading-relaxed text-[var(--color-ink-soft)]">
            {product.description}
          </p>

          <dl className="mt-6 space-y-1 text-sm text-[var(--color-ink-soft)]">
            <div className="flex gap-2">
              <dt className="w-20 shrink-0">SKU</dt>
              <dd>{product.sku}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-20 shrink-0">Stock</dt>
              <dd>
                {product.stockQty > 0
                  ? `${product.stockQty} available`
                  : "Out of stock"}
              </dd>
            </div>
          </dl>

          <AddToCart product={product} />
        </div>
      </div>
    </div>
  );
}
