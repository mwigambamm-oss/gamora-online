"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getProducts,
  updateProduct,
  type Product,
} from "@/lib/products";

export default function InventoryModule() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function loadInventory() {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Failed to load inventory:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInventory();
  }, []);

  async function updateStock(product: Product, value: string) {
    const stock = Number(value);

    if (!Number.isFinite(stock) || stock < 0) return;

    try {
      const updated = await updateProduct(product.id, { stock });

      setProducts((current) =>
        current.map((item) =>
          item.id === product.id ? updated : item
        )
      );
    } catch (error) {
      console.error(error);
      alert("Failed to update stock.");
    }
  }

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return products;

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
    );
  }, [products, search]);

  const totalUnits = products.reduce(
    (sum, product) => sum + Number(product.stock || 0),
    0
  );

  const lowStock = products.filter(
    (product) =>
      Number(product.stock || 0) > 0 &&
      Number(product.stock || 0) <= 5
  ).length;

  const outOfStock = products.filter(
    (product) => Number(product.stock || 0) <= 0
  ).length;

  const inventoryValue = products.reduce(
    (sum, product) =>
      sum +
      Number(product.cost_price || 0) *
        Number(product.stock || 0),
    0
  );

  return (
    <section className="space-y-6">

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-black text-[#3F3437]">
            Inventory
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Monitor stock levels and update inventory.
          </p>
        </div>

        <button
          onClick={loadInventory}
          className="rounded-xl bg-[#800020] px-5 py-3 text-sm font-bold text-white hover:bg-[#6b001b]"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <div className="rounded-2xl border border-[#E8DEE1] bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Products
          </p>

          <p className="mt-2 text-3xl font-black">
            {products.length}
          </p>
        </div>

        <div className="rounded-2xl border border-[#E8DEE1] bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Units in Stock
          </p>

          <p className="mt-2 text-3xl font-black">
            {totalUnits.toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Low Stock
          </p>

          <p className="mt-2 text-3xl font-black text-yellow-700">
            {lowStock}
          </p>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Out of Stock
          </p>

          <p className="mt-2 text-3xl font-black text-red-700">
            {outOfStock}
          </p>
        </div>

      </div>

      <div className="rounded-2xl border border-[#E8DEE1] bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-500">
          Inventory Cost Value
        </p>

        <p className="mt-2 text-2xl font-black">
          TZS {inventoryValue.toLocaleString()}
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E8DEE1] bg-white shadow-sm">

        <div className="flex flex-col justify-between gap-4 border-b p-5 md:flex-row md:items-center">

          <div>
            <h3 className="text-lg font-black">
              Stock Management
            </h3>

            <p className="text-sm text-slate-500">
              Update stock directly from the Business Control Center.
            </p>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product..."
            className="rounded-xl border border-[#E8DEE1] px-4 py-3 text-sm outline-none focus:border-[#800020]"
          />

        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="text-4xl">⏳</div>

            <p className="mt-3 text-sm text-slate-500">
              Loading inventory...
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl">📦</div>

            <h3 className="mt-4 font-bold">
              No products found
            </h3>
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[800px]">

              <thead>
                <tr className="border-b bg-slate-50 text-left text-sm">
                  <th className="px-5 py-4">
                    Product
                  </th>

                  <th className="px-5 py-4">
                    Category
                  </th>

                  <th className="px-5 py-4">
                    Cost Price
                  </th>

                  <th className="px-5 py-4">
                    Current Stock
                  </th>

                  <th className="px-5 py-4">
                    Stock Value
                  </th>

                  <th className="px-5 py-4">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>

                {filteredProducts.map((product) => {

                  const stock = Number(product.stock || 0);

                  const status =
                    stock <= 0
                      ? "Out of Stock"
                      : stock <= 5
                      ? "Low Stock"
                      : "In Stock";

                  return (
                    <tr
                      key={product.id}
                      className="border-b hover:bg-slate-50"
                    >

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">

                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
                              📦
                            </div>
                          )}

                          <div>
                            <p className="font-bold">
                              {product.name}
                            </p>

                            <p className="text-xs text-slate-400">
                              ID: {product.id}
                            </p>
                          </div>

                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {product.category || "-"}
                      </td>

                      <td className="px-5 py-4 font-semibold">
                        TZS{" "}
                        {Number(
                          product.cost_price || 0
                        ).toLocaleString()}
                      </td>

                      <td className="px-5 py-4">

                        <input
                          type="number"
                          min="0"
                          defaultValue={stock}
                          onBlur={(e) =>
                            updateStock(
                              product,
                              e.target.value
                            )
                          }
                          className={`w-28 rounded-lg border px-3 py-2 font-black outline-none ${
                            stock <= 0
                              ? "border-red-300 bg-red-50 text-red-700"
                              : stock <= 5
                              ? "border-yellow-300 bg-yellow-50 text-yellow-700"
                              : "border-green-300 bg-green-50 text-green-700"
                          }`}
                        />

                      </td>

                      <td className="px-5 py-4 font-bold">
                        TZS{" "}
                        {(
                          Number(product.cost_price || 0) *
                          stock
                        ).toLocaleString()}
                      </td>

                      <td className="px-5 py-4">

                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                            status === "Out of Stock"
                              ? "bg-red-100 text-red-700"
                              : status === "Low Stock"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {status}
                        </span>

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </section>
  );
}
