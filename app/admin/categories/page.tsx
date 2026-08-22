"use client";

import { useEffect, useState } from "react";
import { getProducts } from "@/lib/products";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const products = await getProducts();

        const names = products
          .map((product) => product.category)
          .filter((category): category is string => Boolean(category));

        setCategories([...new Set(names)]);
      } catch (error) {
        console.error("Failed to load categories:", error);
        setCategories([]);
      }
    }

    loadCategories();
  }, []);

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="border-b bg-white px-6 py-5 shadow-sm">
        <a href="/admin" className="font-bold text-orange-600">
          ← Back to Dashboard
        </a>

        <h1 className="mt-2 text-2xl font-black">
          Categories
        </h1>

        <p className="text-sm text-gray-500">
          Manage product categories
        </p>
      </header>

      <div className="mx-auto max-w-7xl p-6">
        <div className="rounded-xl bg-white shadow-sm">
          <div className="border-b p-6">
            <h2 className="text-xl font-black">
              Product Categories
            </h2>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-2 md:grid-cols-3">
            {categories.map((category) => (
              <div
                key={category}
                className="rounded-xl border p-5"
              >
                <div className="text-3xl">🏷️</div>

                <h3 className="mt-3 font-bold">
                  {category}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Product category
                </p>
              </div>
            ))}

            {categories.length === 0 && (
              <p className="text-sm text-gray-500">
                No categories found.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
