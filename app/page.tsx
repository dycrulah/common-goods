import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getCategories, getFeaturedProducts } from "@/lib/queries/products-server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, featured] = await Promise.all([
    getCategories(),
    getFeaturedProducts(4),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-6 sm:pt-16">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <p className="text-sm uppercase tracking-wide text-[var(--color-forest)]">
              New this season
            </p>
            <h1 className="font-display mt-3 text-4xl leading-[1.05] sm:text-5xl">
              Things worth keeping
              <br />
              for a long time.
            </h1>
            <p className="mt-5 max-w-sm text-[var(--color-ink-soft)]">
              Cast iron, oak, linen, stone — a small catalogue of goods
              we&apos;d buy ourselves, chosen to earn a place in daily use.
            </p>
            <Link
              href="/products"
              className="mt-7 inline-block rounded-full bg-[var(--color-forest)] px-6 py-3 text-sm text-white hover:bg-[var(--color-forest-dark)]"
            >
              Shop all products
            </Link>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-sm md:ml-8 md:mt-10">
            <Image
              src={featured[0].images[0].url}
              alt={featured[0].images[0].alt}
              fill
              sizes="(min-width: 768px) 40vw, 90vw"
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* Promo banner */}
      <section className="border-y bg-[var(--color-forest)] text-[var(--color-bg)]">
        <div className="mx-auto max-w-6xl px-4 py-3 text-center text-sm sm:px-6">
          Free delivery within Osun State on orders over ₦50,000
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="font-display text-2xl">Shop by room</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="flex items-center justify-center border bg-[var(--color-card)] px-4 py-10 text-center text-sm hover:border-[var(--color-forest)]"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl">Featured</h2>
          <Link href="/products" className="text-sm text-[var(--color-forest)]">
            View all
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </>
  );
}
