"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProducts, type Product } from "@/lib/products";

const CATEGORY_IMAGES: Record<string,string> = {
  Fashion: "/categories/fashion.jpg",
  Shoes: "/categories/shoes.jpg",
  Electronics: "/categories/electronics.jpg",
  Accessories: "/categories/accessories.jpg",
  "Home & Kitchen": "/categories/home.jpg",
};

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);

  const name = decodeURIComponent(
    String(params.name || "")
  );

  useEffect(() => {
    async function load() {
      const all = await getProducts();

      setProducts(
        all.filter(
          (p) =>
            p.category?.toLowerCase() ===
            name.toLowerCase()
        )
      );
    }

    load();
  }, [name]);

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-6">

      <section className="mx-auto max-w-[1280px]">

        <div className="mb-6 flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">

          {CATEGORY_IMAGES[name] && (
            <img
              src={CATEGORY_IMAGES[name]}
              alt={name}
              className="h-16 w-16 rounded-xl object-cover"
            />
          )}

          <div>
            <h1 className="text-lg font-black text-slate-900 sm:text-lg">
              {name}
            </h1>

            <p className="text-xs text-slate-500">
              Explore products in this category
            </p>
          </div>

        </div>


        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">

          {products.map((item)=>(
            <div
              key={item.id}
              className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md"
            >

              <button
                onClick={() =>
                  router.push(`/product/${item.id}`)
                }
                className="w-full text-left"
              >

                <div className="h-32 sm:h-40">

                  <img
                    src={
                      item.image ||
                      item.images?.[0] ||
                      ""
                    }
                    alt={item.name}
                    className="h-full w-full object-contain"
                  />

                </div>


                <p className="mt-2 line-clamp-2 text-[12px] font-bold text-slate-700">
                  {item.name}
                </p>


                <p className="mt-2 text-xs font-medium text-sky-700">
                  TZS {item.price.toLocaleString()}
                </p>


              </button>


              <button
                onClick={() =>
                  router.push(`/product/${item.id}`)
                }
                className="mt-3 w-full rounded-lg bg-slate-900 py-2 text-xs font-black text-white"
              >
                View Product
              </button>


            </div>
          ))}

        </div>

      </section>

    </main>
  );
}
