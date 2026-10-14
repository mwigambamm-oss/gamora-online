import type { Metadata } from "next";
import { getProducts } from "@/lib/products";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "All Products | Gamora Online Tanzania",
  description:
    "Browse fashion, shoes, electronics, home products and more at Gamora Online Tanzania.",
  alternates: {
    canonical: "https://gamoraonline.co.tz/all-products",
  },
};

export default async function AllProductsPage() {
  const products = await getProducts({ limit: 500, offset: 0 });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-3 text-2xl font-bold">
        All Products at Gamora Online
      </h1>
      <p className="mb-6">
        Browse our online shopping catalogue in Tanzania.
      </p>
      <p className="mb-6 text-sm">
        {products.length} products available in our catalogue.
      </p>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <li key={product.id} className="border-b py-3">
            <a
              href={`/product/${product.id}`}
              className="font-medium underline"
            >
              {product.name}
            </a>
            <p className="mt-1 text-sm">
              {product.category || "Shop online"}
            </p>
            <p className="text-sm">
              TZS {Number(product.price || 0).toLocaleString("en-TZ")}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
