// These shapes mirror the Supabase schema from Phase 1, so swapping the
// mock data source for real queries in Phase 3 won't change any component.

export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type ProductImage = {
  url: string;
  alt: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  currency: "NGN";
  sku: string;
  stockQty: number;
  categorySlug: string;
  isPublished: boolean;
  images: ProductImage[];
};

export type CartLine = {
  productId: string;
  quantity: number;
};
