"use client";

import { useEffect, useState } from "react";
import { getProducts, type Product } from "@/lib/products";

export default function ReviewsModule() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Reviews error:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const rated = products.filter(
    (product) => Number(product.rating || 0) > 0
  );

  const average =
    rated.length > 0
      ? rated.reduce(
          (sum, product) => sum + Number(product.rating || 0),
          0
        ) / rated.length
      : 0;

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-black text-[#3F3437]">
            Reviews
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Product ratings and customer feedback overview.
          </p>
        </div>

        <button
          onClick={load}
          className="rounded-xl border border-[#E8DEE1] bg-white px-5 py-3 text-sm font-bold hover:bg-slate-50"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#E8DEE1] bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Rated Products</p>
          <p className="mt-2 text-3xl font-black">
            {loading ? "..." : rated.length}
          </p>
        </div>

        <div className="rounded-2xl border border-[#E8DEE1] bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Average Rating</p>
          <p className="mt-2 text-3xl font-black">
            {loading ? "..." : `⭐ ${average.toFixed(1)}`}
          </p>
        </div>

        <div className="rounded-2xl border border-[#E8DEE1] bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Products</p>
          <p className="mt-2 text-3xl font-black">
            {loading ? "..." : products.length}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E8DEE1] bg-white shadow-sm">
        <div className="border-b p-5">
          <h3 className="font-black">Product Ratings</h3>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-500">
            Loading ratings...
          </div>
        ) : rated.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-4xl">⭐</div>
            <p className="mt-3 font-bold">No ratings available yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Product ratings will appear here when available.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {rated.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between gap-4 p-5"
              >
                <div>
                  <p className="font-bold">{product.name}</p>
                  <p className="text-xs text-slate-500">
                    Product ID: {product.id}
                  </p>
                </div>

                <span className="rounded-full bg-yellow-50 px-3 py-1 text-sm font-black text-yellow-700">
                  ⭐ {Number(product.rating || 0).toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
