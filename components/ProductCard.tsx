import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/types";
import { formatNaira } from "@/lib/format";

export default function ProductCard({ product }: { product: Product }) {
  const outOfStock = product.stockQty <= 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[var(--color-card)]">
        <Image
          src={product.images[0].url}
          alt={product.images[0].alt}
          fill
          sizes="(min-width: 768px) 25vw, 50vw"
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        {outOfStock && (
          <span className="absolute left-2 top-2 rounded-full bg-[var(--color-ink)] px-2 py-0.5 text-xs text-white">
            Out of stock
          </span>
        )}
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <h3 className="text-sm">{product.name}</h3>
        <span className="shrink-0 text-sm text-[var(--color-ink-soft)]">
          {formatNaira(product.priceCents)}
        </span>
      </div>
    </Link>
  );
}
