"use client";

import Link from "next/link";

type Product = {
  id: number;
  name: string;
  price: number;
  image?: string;
  category?: string;
};

export default function RelatedProducts({
  products,
}: {
  products: Product[];
}) {
  if (!products || products.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="mb-5 text-xl font-bold text-gray-900">
        Related Products
      </h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="rounded-xl border bg-white p-3 transition hover:shadow-md"
          >
            <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  No Image
                </div>
              )}
            </div>

            <h3 className="mt-2 line-clamp-2 text-sm font-semibold">
              {product.name}
            </h3>

            <p className="mt-1 text-sm font-bold">
              TZS {product.price.toLocaleString()}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
