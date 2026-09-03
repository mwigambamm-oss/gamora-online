"use client";

import Link from "next/link";

type Product = {
  id: number;
  name: string;
  price: number;
  oldPrice?: number;
  image?: string;
  images?: string[];
  category?: string;
};

export default function RelatedProducts({
  products,
}: {
  products: Product[];
}) {
  if (!products || products.length === 0) return null;

  return (
    <section className="mt-8 border-t border-[#eeeeee] pt-6 sm:mt-10 sm:pt-8">
      <h2 className="mb-4 text-base font-bold text-[#222] sm:mb-5 sm:text-lg">
        You May Also Like
      </h2>

      <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-8 lg:grid-cols-4 lg:gap-x-5">
        {products.map((product) => {
          const image =
            product.images?.[0] ||
            product.image ||
            "";

          return (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="group min-w-0 overflow-hidden"
            >
              {/* PRODUCT IMAGE */}
              <div className="relative h-[155px] w-full overflow-hidden bg-transparent sm:h-[190px] lg:h-[210px]">
                {image ? (
                  <img
                    src={image}
                    alt={product.name}
                    loading="lazy"
                    className="block h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                    No Image
                  </div>
                )}
              </div>

              {/* PRODUCT INFO */}
              <div className="pt-1.5">
                <h3 className="line-clamp-2 text-[11px] font-medium leading-4 text-[#222] sm:text-xs sm:leading-5">
                  {product.name}
                </h3>

                <p className="mt-1 text-xs font-bold text-[#374151] sm:text-sm">
                  TZS {Number(product.price).toLocaleString()}
                </p>

                {typeof product.oldPrice === "number" &&
                  product.oldPrice > product.price && (
                    <p className="text-[10px] text-[#999] line-through sm:text-xs">
                      TZS {product.oldPrice.toLocaleString()}
                    </p>
                  )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
