"use client";

import { useEffect, useState } from "react";
import {
  getProducts,
  deleteProduct,
  type Product,
} from "@/lib/products";

export default function ProductsModule() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadProducts() {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error(error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function removeProduct(id:number){
    if(!confirm("Delete product?")) return;

    await deleteProduct(id);
    loadProducts();
  }

  return (
    <section className="space-y-6">

      <div>
        <h2 className="text-2xl font-black text-[#3F3437]">
          Products
        </h2>

        <p className="text-sm text-slate-500">
          Manage GAMORA products
        </p>
      </div>


      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">

        {loading ? (
          <div className="p-8 text-center">
            Loading products...
          </div>
        ) : (

        <table className="w-full">

          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left">Name</th>
              <th className="p-4">Price</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>


          <tbody>

          {products.map(product => (

            <tr key={product.id} className="border-t">

              <td className="p-4 font-bold">
                {product.name}
              </td>

              <td className="p-4">
                TZS {product.price.toLocaleString()}
              </td>

              <td className="p-4">
                {product.stock}
              </td>

              <td className="p-4">

                <button
                onClick={()=>removeProduct(product.id)}
                className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white">
                  Delete
                </button>

              </td>

            </tr>

          ))}

          </tbody>

        </table>

        )}

      </div>

    </section>
  );
}
