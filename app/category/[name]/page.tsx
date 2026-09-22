"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProducts, shuffleProducts, type Product } from "@/lib/products";

const CATEGORY_IMAGES: Record<string, string> = {
  "Women's Fashion": "/images/womens-fashion.jpg",
  "Men's Fashion": "/images/mens-fashion.jpg",
  Shoes: "/images/shoes.jpg",
  "Phones & Electronics": "/images/phone.jpg",
  "Home & Kitchen": "/images/home-kitchen.jpg",
  Accessories: "/images/accessories.jpg",
  "Beauty & Personal Care": "/images/categories/beauty.jpg",
  "Computers & Accessories": "/images/categories/computers.jpg",
  "Baby & Kids": "/images/categories/baby.jpg",
  "Sports & Fitness": "/images/categories/sports.jpg",
  Automotive: "/images/categories/automotive.jpg",
  "Tools & Hardware": "/images/categories/tools.jpg",
  "Books & Stationery": "/images/categories/books.jpg",
  "Jewelry & Watches": "/images/categories/jewelry.jpg",
  Furniture: "/images/categories/furniture.jpg",
  "Garden & Outdoor": "/images/categories/garden.jpg",
  "Health & Wellness": "/images/categories/health.jpg",
  Gaming: "/images/categories/gaming.jpg",
  "Kids Fashion": "/images/categories/baby.jpg",
};

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const name = decodeURIComponent(String(params.name || ""));

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      try {
        const data = await getProducts({
          category: name,
          limit: 100,
        });

        if (!cancelled) {
          setProducts(shuffleProducts(data));
        }
      } catch (error) {
        console.error("Category products loading error:", error);

        if (!cancelled) {
          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [name]);

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-6">
      <section className="mx-auto max-w-[1440px]">

        <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex min-w-0 items-center gap-4">
            {CATEGORY_IMAGES[name] && (
              <img
                src={CATEGORY_IMAGES[name]}
                alt={name}
                width={64}
                height={64}
                loading="eager"
                fetchPriority="high"
                className="h-16 w-16 shrink-0 rounded-xl object-cover"
              />
            )}

            <div className="min-w-0">
              <h1 className="text-lg font-black text-slate-900 sm:text-xl">
                {name}
              </h1>

              <p className="text-xs text-slate-500">
                Explore products in this category
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            className="shrink-0 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 transition hover:border-[#E30613] hover:text-[#E30613]"
          >
            ← Back
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={index}
                className="h-[250px] animate-pulse rounded-xl bg-white"
              />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {products.map((item) => (
              <div
                key={item.id}
                className="group min-w-0 bg-transparent"
              >
                <div className="relative">
                  {(() => {
                    const discount =
                      item.oldPrice && Number(item.oldPrice) > Number(item.price)
                        ? Math.round(
                            ((Number(item.oldPrice) - Number(item.price)) /
                              Number(item.oldPrice)) *
                              100
                          )
                        : 0;

                    return discount > 0 ? (
                      <span className="pointer-events-none absolute right-1 top-1 z-20 inline-flex w-auto max-w-fit items-center justify-center rounded-md bg-[#D00000] px-1.5 py-0.5 text-[9px] font-black leading-none text-white">
                        -{discount}%
                      </span>
                    ) : null;
                  })()}

                  <div className="absolute right-1 top-8 z-20 flex flex-col items-center gap-1">
                    <button
                      type="button"
                      onClick={() => router.push(`/product/${item.id}`)}
                      aria-label="Like product"
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#555] shadow-sm transition hover:text-[#D00000]"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-[15px] w-[15px]"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
                      </svg>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push(`/product/${item.id}`)}
                    className="block w-full text-left"
                  >
                    <div className="h-32 sm:h-40">
                      <img
                        src={item.image || item.images?.[0] || ""}
                        alt={item.name}
                        loading={products.indexOf(item) < 6 ? "eager" : "lazy"}
                        fetchPriority={products.indexOf(item) < 3 ? "high" : "auto"}
                        decoding="async"
                        width={320}
                        height={320}
                        className="h-full w-full object-contain"
                      />
                    </div>

                    <div className="mt-2 text-center">
                      <p className="line-clamp-2 text-[11px] font-semibold text-[#222222]">
                        {item.name}
                      </p>

                      <div className="mt-1 flex items-center justify-center gap-3 text-[8px] font-bold text-[#111111]">
                        <span>
                          ❤️ {Math.max(200, Number(item.likes || 200))} Likes
                        </span>

                        <span>
                          🛒 {Math.max(300, Number(item.orders_count || 300))} Ordered
                        </span>
                      </div>

                      <p className="mt-2 text-xs font-black text-[#E30613]">
                        TZS {item.price.toLocaleString()}
                      </p>
                    </div>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => router.push(`/product/${item.id}`)}
                  className="mx-auto mt-3 block w-[55%] rounded-lg bg-[#E30613] py-2 text-[11px] font-black text-white transition hover:bg-[#c9000b]"
                >
                  View Product
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-sm">
            <p className="text-sm font-bold text-slate-700">
              No products found in this category.
            </p>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-5 rounded-lg bg-[#E30613] px-6 py-3 text-xs font-black text-white"
            >
              Continue Shopping
            </button>
          </div>
        )}

      </section>
    </main>
  );
}
