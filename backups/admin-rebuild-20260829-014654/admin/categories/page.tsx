"use client";

import { useEffect, useMemo, useState } from "react";
import { getProducts, type Product } from "@/lib/products";

type CategorySummary = {
  name: string;
  count: number;
};

export default function CategoriesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadCategories() {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Failed to load categories:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  const categories = useMemo<CategorySummary[]>(() => {
    const categoryMap = new Map<string, number>();

    products.forEach((product) => {
      const category = product.category?.trim();

      if (category) {
        categoryMap.set(
          category,
          (categoryMap.get(category) || 0) + 1
        );
      }
    });

    return Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [products]);

  const totalProducts = categories.reduce(
    (sum, category) => sum + category.count,
    0
  );

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="border-b bg-white px-6 py-5 shadow-sm">
        <div className="mx-auto max-w-7xl">
          <a href="/admin" className="font-bold text-orange-600">
            ← Back to Dashboard
          </a>

          <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-black">
                Categories
              </h1>

              <p className="text-sm text-gray-500">
                Product categories from your GAMORA ONLINE store
              </p>
            </div>

            <button
              onClick={loadCategories}
              className="rounded-lg border px-4 py-2 font-bold hover:bg-gray-50"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl p-6">
        {/* SUMMARY */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Categories
            </p>

            <p className="mt-2 text-3xl font-black text-orange-600">
              {loading ? "..." : categories.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Products Categorized
            </p>

            <p className="mt-2 text-3xl font-black">
              {loading ? "..." : totalProducts}
            </p>
          </div>
        </div>

        {/* CATEGORIES */}

        <div className="rounded-xl bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b p-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-black">
                Product Categories
              </h2>

              <p className="text-sm text-gray-500">
                Categories are created automatically from your products.
              </p>
            </div>

            <a
              href="/admin/products"
              className="rounded-lg bg-orange-600 px-4 py-2 text-center text-sm font-bold text-white hover:bg-orange-700"
            >
              + Add Product
            </a>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="text-4xl">⏳</div>

              <p className="mt-3 text-sm text-gray-500">
                Loading categories...
              </p>
            </div>
          ) : categories.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl">🏷️</div>

              <h3 className="mt-4 text-lg font-bold">
                No categories found
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Add products to create categories automatically.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 p-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {categories.map((category) => (
                <div
                  key={category.name}
                  className="rounded-xl border bg-white p-5 transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="text-3xl">🏷️</div>

                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                      {category.count} product
                      {category.count !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-black">
                    {category.name}
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Available in your store
                  </p>

                  <a
                    href="/admin/products"
                    className="mt-4 inline-block text-sm font-bold text-orange-600 hover:underline"
                  >
                    Manage Products →
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
