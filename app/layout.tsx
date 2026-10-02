import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getCategories } from "@/lib/queries/products-server";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Common Goods — well-made things for home",
  description:
    "Kitchen, home, desk and bath goods, shipped from Osogbo, Nigeria.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const [categories, { data: { user } }] = await Promise.all([
    getCategories(),
    supabase.auth.getUser(),
  ]);
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        {/*
          Using a stylesheet link rather than next/font/google here so the
          project builds without network access to Google Fonts; swap for
          next/font/google once you're building somewhere with that access.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,400..500&family=Work+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <CartProvider>
          <Nav categories={categories} isSignedIn={!!user} />
          <main className="flex-1">{children}</main>
          <Footer categories={categories} />
        </CartProvider>
      </body>
    </html>
  );
}
