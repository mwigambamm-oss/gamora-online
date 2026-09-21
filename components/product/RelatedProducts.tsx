"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Product = {
  id: number;
  name: string;
  name_sw?: string;
  price: number;
  oldPrice?: number;
  image?: string;
  images?: string[];
  category?: string;
  likes?: number;
  orders_count?: number;
};

function RelatedProductCard({
  product,
  language,
}: {
  product: Product;
  language: "en" | "sw";
}) {
  const image = product.images?.[0] || product.image || "";

  const [likes, setLikes] = useState(
    Math.max(200, Number(product.likes || 200))
  );

  const [orders, setOrders] = useState(
    Math.max(300, Number(product.orders_count || 300))
  );

  useEffect(() => {
    let cancelled = false;

    const loadSocialProof = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const headers: HeadersInit = session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {};

        const response = await fetch(
          `/api/products/${product.id}/like`,
          {
            headers,
            cache: "no-store",
          }
        );

        if (!response.ok) return;

        const data = await response.json();

        if (!cancelled) {
          setLikes(Math.max(200, Number(data.likes || 200)));
          setOrders(Math.max(300, Number(data.orders || 300)));
        }
      } catch (error) {
        console.error(
          "Failed to load related product social proof:",
          error
        );
      }
    };

    loadSocialProof();

    return () => {
      cancelled = true;
    };
  }, [product.id]);

  const displayName =
product.name;

  return (
    <Link
      href={`/product/${product.id}`}
      className="group block min-w-0 bg-white"
    >
      <div className="relative flex h-[115px] w-full items-center justify-center overflow-hidden bg-white sm:h-[130px] lg:h-[145px]">
        {typeof product.oldPrice === "number" &&
          product.oldPrice > product.price && (
            <span className="absolute right-1 top-1 z-10 rounded-sm bg-[#E30613] px-1.5 py-0.5 text-[8px] font-bold text-white sm:text-[9px]">
              -{Math.round(
                ((product.oldPrice - product.price) / product.oldPrice) * 100
              )}%
            </span>
          )}

        {image ? (
          <img
            src={image}
            alt={displayName}
            loading="lazy"
            className="h-full w-full object-contain object-center transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="text-[10px] text-slate-400">
            No Image
          </span>
        )}
      </div>

      <div className="pt-1.5 text-center">
        <h3 className="line-clamp-2 text-[10px] font-normal leading-[14px] text-[#333] sm:text-[11px] sm:leading-[15px]">
          {displayName}
        </h3>

        <div className="mt-1 flex flex-wrap items-baseline justify-center gap-1">
          <span className="text-[12px] font-bold text-[#E30613] sm:text-[13px]">
            TZS {Number(product.price).toLocaleString()}
          </span>

          {typeof product.oldPrice === "number" &&
            product.oldPrice > product.price && (
              <span className="text-[8px] font-bold text-[#222] line-through sm:text-[9px]">
                TZS {product.oldPrice.toLocaleString()}
              </span>
            )}
        </div>

        <div className="mt-1 flex items-center justify-center gap-2 whitespace-nowrap text-[8px] text-slate-500 sm:text-[9px]">
          <span className="font-bold text-[#333]">
            ❤️ {likes} Likes
          </span>
          <span className="font-bold text-[#333]">
            🛒 {orders} Ordered
          </span>
        </div>

        <div className="mt-1.5 flex justify-center">
          <span className="inline-flex rounded-md bg-[#E30613] px-3 py-1 text-[9px] font-semibold text-white">
            {language === "sw" ? "Ongeza" : "Add"}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function RelatedProducts({
  products,
  language,
}: {
  products: Product[];
  language: "en" | "sw";
}) {
  if (!products?.length) return null;

  return (
    <section className="mt-8 bg-white pt-2 sm:mt-10">
      <h2 className="mb-4 px-1 text-[16px] font-bold text-[#222] sm:text-[18px]">
        {language === "sw" ? "Unaweza Pia Kupenda" : "You May Also Like"}
      </h2>

      <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
        {products.map((product) => (
          <RelatedProductCard
            key={product.id}
            product={product}
            language={language}
          />
        ))}
      </div>
    </section>
  );
}
