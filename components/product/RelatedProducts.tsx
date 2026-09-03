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
  if (!products?.length) return null;

  return (
    <section className="mt-8 bg-white pt-2 sm:mt-10">
      <h2 className="mb-5 px-1 text-[16px] font-bold text-[#222] sm:text-[18px]">
        You May Also Like
      </h2>

      <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
        {products.map((product) => {
          const image = product.images?.[0] || product.image || "";

          return (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="group block min-w-0 bg-white"
            >
              {/* IMAGE ONLY — NO BOX */}
              <div className="flex h-[155px] w-full items-center justify-center bg-white sm:h-[175px] lg:h-[190px]">
                {image ? (
                  <img
                    src={image}
                    alt={product.name}
                    loading="lazy"
                    className="h-full w-full object-contain object-center transition-transform duration-300 group-hover:scale-[1.04]"
                  />
                ) : (
                  <span className="text-[10px] text-gray-400">
                    No Image
                  </span>
                )}
              </div>

              {/* TEXT DIRECTLY UNDER IMAGE */}
              <div className="pt-1.5">
                <h3 className="line-clamp-2 text-[10px] font-normal leading-[14px] text-[#333] sm:text-[11px] sm:leading-[15px]">
                  {product.name}
                </h3>

                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-[12px] font-bold text-[#e30613] sm:text-[13px]">
                    TZS {Number(product.price).toLocaleString()}
                  </span>

                  {typeof product.oldPrice === "number" &&
                    product.oldPrice > product.price && (
                      <span className="text-[8px] text-[#999] line-through sm:text-[9px]">
                        TZS {product.oldPrice.toLocaleString()}
                      </span>
                    )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
