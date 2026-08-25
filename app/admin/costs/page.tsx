"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
};

type Cost = {
  product_id: number;
  cost_price: number;
  supplier?: string;
};

export default function ProductCostsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [costs, setCosts] = useState<Record<number, Cost>>({});
  const [saving, setSaving] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const [{ data: productsData, error: productsError }, costsResponse] =
      await Promise.all([
        supabase
          .from("products")
          .select("id,name,price,stock,category")
          .order("name"),
        fetch("/api/product-costs"),
      ]);

    if (productsError) {
      alert(productsError.message);
      return;
    }

    const costResult = await costsResponse.json();

    const map: Record<number, Cost> = {};

    for (const cost of costResult.costs || []) {
      map[Number(cost.product_id)] = {
        product_id: Number(cost.product_id),
        cost_price: Number(cost.cost_price || 0),
        supplier: cost.supplier || "",
      };
    }

    setProducts(productsData || []);
    setCosts(map);
  }

  function updateCost(
    productId: number,
    field: "cost_price" | "supplier",
    value: string
  ) {
    setCosts((current) => ({
      ...current,
      [productId]: {
        product_id: productId,
        cost_price:
          field === "cost_price"
            ? Number(value || 0)
            : current[productId]?.cost_price || 0,
        supplier:
          field === "supplier"
            ? value
            : current[productId]?.supplier || "",
      },
    }));
  }

  async function save(product: Product) {
    const cost = costs[product.id];

    if (!cost || cost.cost_price < 0) {
      alert("Weka bei halali ya kununua.");
      return;
    }

    setSaving(product.id);

    try {
      const response = await fetch("/api/product-costs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: product.id,
          cost_price: cost.cost_price,
          supplier: cost.supplier || "",
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Failed to save cost"
        );
      }

      alert(`✅ ${product.name} cost saved`);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to save"
      );
    } finally {
      setSaving(null);
    }
  }

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return products;

    return products.filter((p) =>
      `${p.name} ${p.category}`
        .toLowerCase()
        .includes(q)
    );
  }, [products, search]);

  const money = (n: number) =>
    `TZS ${Number(n || 0).toLocaleString()}`;

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Product Cost Management
          </h1>

          <p className="mt-1 text-slate-500">
            Weka bei halisi ya kununua bidhaa ili GAMORA
            ihesabu profit automatically.
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product..."
            className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2"
          />
        </div>

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-slate-900 text-left text-sm text-white">
                <tr>
                  <th className="p-4">Product</th>
                  <th className="p-4">Selling Price</th>
                  <th className="p-4">Buying Cost</th>
                  <th className="p-4">Profit / Unit</th>
                  <th className="p-4">Margin</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Supplier</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => {
                  const cost =
                    costs[product.id]?.cost_price || 0;

                  const profit =
                    Number(product.price || 0) - cost;

                  const margin =
                    Number(product.price || 0) > 0
                      ? (profit / Number(product.price)) * 100
                      : 0;

                  return (
                    <tr
                      key={product.id}
                      className="border-t"
                    >
                      <td className="p-4">
                        <div className="font-bold">
                          {product.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {product.category}
                        </div>
                      </td>

                      <td className="p-4 font-semibold">
                        {money(product.price)}
                      </td>

                      <td className="p-4">
                        <input
                          type="number"
                          min="0"
                          value={
                            costs[product.id]
                              ?.cost_price ?? ""
                          }
                          onChange={(e) =>
                            updateCost(
                              product.id,
                              "cost_price",
                              e.target.value
                            )
                          }
                          className="w-36 rounded-lg border px-3 py-2"
                          placeholder="0"
                        />
                      </td>

                      <td
                        className={`p-4 font-bold ${
                          profit >= 0
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {money(profit)}
                      </td>

                      <td className="p-4 font-semibold">
                        {margin.toFixed(1)}%
                      </td>

                      <td className="p-4">
                        {product.stock}
                      </td>

                      <td className="p-4">
                        <input
                          value={
                            costs[product.id]
                              ?.supplier || ""
                          }
                          onChange={(e) =>
                            updateCost(
                              product.id,
                              "supplier",
                              e.target.value
                            )
                          }
                          className="w-40 rounded-lg border px-3 py-2"
                          placeholder="Supplier"
                        />
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() => save(product)}
                          disabled={
                            saving === product.id
                          }
                          className="rounded-lg bg-slate-900 px-4 py-2 font-bold text-white disabled:opacity-50"
                        >
                          {saving === product.id
                            ? "Saving..."
                            : "Save"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!filteredProducts.length && (
            <div className="p-10 text-center text-slate-500">
              No products found.
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
