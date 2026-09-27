"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getProducts, shuffleProducts, type Product } from "@/lib/products";

const SUBCATEGORY_RULES: Record<string, Record<string, string[]>> = {
  "Women's Fashion": {
    Dresses: ["dress", "dresses", "gown"],
    Tops: ["top", "tops", "blouse", "crop top"],
    Shirts: ["shirt", "shirts"],
    Jeans: ["jean", "jeans", "denim"],
    Trousers: ["trouser", "trousers", "pants"],
    Skirts: ["skirt", "skirts"],
    Jumpsuits: ["jumpsuit", "jumpsuits"],
    Hijabs: ["hijab", "hijabs", "headscarf"],
  },
  "Men's Fashion": {
    Shirts: ["shirt", "shirts"],
    "T-Shirts": ["t-shirt", "tshirt", "tee"],
    Jeans: ["jean", "jeans", "denim"],
    Trousers: ["trouser", "trousers", "pants"],
    Suits: ["suit", "suits", "blazer"],
    Jackets: ["jacket", "jackets", "coat"],
  },
  Shoes: {
    Heels: ["heel", "heels", "high heel", "pump"],
    Sneakers: ["sneaker", "sneakers", "trainer", "trainers"],
    Sandals: ["sandal", "sandals"],
    Flats: ["flat shoe", "flats", "flat shoes"],
    Boots: ["boot", "boots"],
    Loafers: ["loafer", "loafers"],
    Slippers: ["slipper", "slippers"],
    "Formal Shoes": ["formal shoe", "formal shoes", "office shoe"],
  },
  "Phones & Electronics": {
    Smartphones: ["smartphone", "phone", "iphone", "samsung", "android", "mobile"],
    Earphones: ["earphone", "earphones", "earbud", "earbuds"],
    Headphones: ["headphone", "headphones"],
    Chargers: ["charger", "chargers", "adapter", "adaptor"],
    "Power Banks": ["power bank", "powerbank"],
    Speakers: ["speaker", "speakers", "bluetooth speaker"],
    Cables: ["cable", "usb cable", "charging cable"],
  },
  "Home & Kitchen": {
    Cookware: ["cookware", "pan", "frying pan", "pot", "pots"],
    "Pressure Cookers": ["pressure cooker", "pressure cookers"],
    "Kitchen Tools": ["kitchen tool", "utensil", "utensils", "spatula"],
    Storage: ["storage", "container", "containers", "organizer"],
    Cleaning: ["cleaning", "mop", "broom", "cleaner"],
    Tableware: ["plate", "plates", "cup", "cups", "cutlery"],
  },
  Accessories: {
    Bags: ["bag", "bags", "handbag", "backpack", "purse"],
    Wallets: ["wallet", "wallets"],
    Belts: ["belt", "belts"],
    Caps: ["cap", "caps", "hat", "hats"],
    Sunglasses: ["sunglasses", "sun glasses"],
    Scarves: ["scarf", "scarves"],
  },
  "Beauty & Personal Care": {
    Makeup: ["makeup", "lipstick", "foundation", "mascara", "concealer"],
    Perfumes: ["perfume", "perfumes", "fragrance"],
    Skincare: ["skincare", "skin care", "cream", "serum", "lotion"],
    "Hair Care": ["hair", "shampoo", "conditioner", "wig", "wigs"],
    "Body Care": ["body care", "body lotion", "soap", "deodorant"],
  },
  "Computers & Accessories": {
    Laptops: ["laptop", "notebook"],
    "Desktop Computers": ["desktop", "desktop computer", "pc"],
    Keyboards: ["keyboard", "keyboards"],
    Mice: ["mouse", "mice"],
    Monitors: ["monitor", "monitors", "display"],
    "Computer Accessories": ["computer accessory", "usb hub", "webcam"],
  },
  "Baby & Kids": {
    "Baby Clothes": ["baby clothes", "baby clothing", "infant clothes"],
    "Kids Shoes": ["kids shoes", "children shoes", "baby shoes"],
    Toys: ["toy", "toys"],
    "Baby Care": ["baby care", "diaper", "diapers", "feeding bottle"],
    "Kids Bags": ["kids bag", "school bag", "children bag"],
  },
  "Sports & Fitness": {
    Fitness: ["fitness", "gym", "workout"],
    Running: ["running", "running shoe"],
    Football: ["football", "soccer"],
    Basketball: ["basketball"],
    Cycling: ["cycling", "bicycle", "bike"],
    "Sports Accessories": ["sports accessory", "sports accessories"],
  },
  Automotive: {
    "Car Accessories": ["car accessory", "car accessories"],
    "Motorcycle Accessories": ["motorcycle", "motorbike", "boda"],
    "Car Care": ["car care", "car wash", "polish"],
    Lighting: ["car light", "led light", "headlight"],
    Tools: ["automotive tool", "car tool"],
  },
  "Tools & Hardware": {
    "Hand Tools": ["hand tool", "hammer", "pliers", "screwdriver"],
    "Power Tools": ["power tool", "drill", "grinder"],
    Hardware: ["hardware", "bolt", "nut", "screw"],
    Electrical: ["electrical", "switch", "socket"],
    "Safety Equipment": ["safety", "helmet", "gloves", "goggles"],
  },
  "Books & Stationery": {
    Books: ["book", "books", "novel"],
    Notebooks: ["notebook", "notebooks", "exercise book"],
    Pens: ["pen", "pens", "ballpoint"],
    "School Supplies": ["school", "school supplies", "pencil", "eraser"],
    Office: ["office", "stapler", "file", "folder"],
  },
  "Jewelry & Watches": {
    Watches: ["watch", "watches", "smart watch", "smartwatch"],
    Rings: ["ring", "rings"],
    Necklaces: ["necklace", "necklaces"],
    Bracelets: ["bracelet", "bracelets"],
    Earrings: ["earring", "earrings"],
  },
  Furniture: {
    Sofas: ["sofa", "sofas", "couch"],
    Beds: ["bed", "beds", "bedroom"],
    Tables: ["table", "tables"],
    Chairs: ["chair", "chairs"],
    Cabinets: ["cabinet", "cabinets", "wardrobe"],
  },
  "Garden & Outdoor": {
    Gardening: ["garden", "gardening", "plant"],
    "Outdoor Furniture": ["outdoor furniture", "patio"],
    "Garden Tools": ["garden tool", "pruner", "watering"],
    Camping: ["camping", "tent"],
    "Outdoor Lighting": ["outdoor light", "solar light"],
  },
  "Health & Wellness": {
    "Personal Care": ["personal care"],
    Fitness: ["fitness", "exercise", "workout"],
    Wellness: ["wellness", "massage"],
    "Health Accessories": ["health accessory", "thermometer"],
    "Medical Supplies": ["medical", "medical supplies"],
  },
  Gaming: {
    "Gaming Consoles": ["gaming console", "playstation", "xbox", "console"],
    "Gaming Controllers": ["controller", "gamepad"],
    "Gaming Headsets": ["gaming headset", "gaming headphones"],
    "Gaming Accessories": ["gaming accessory", "gaming accessories"],
    "Gaming Chairs": ["gaming chair", "gaming chairs"],
  },
};

function getAutomaticSubcategory(product: Product, category: string) {
  const text = [
    product.name,
    product.name_sw,
    product.description,
    product.description_sw,
    ...Object.entries(product.specifications || {}).map(([key, value]) => `${key} ${value}`),
    ...Object.entries(product.specifications_sw || {}).map(([key, value]) => `${key} ${value}`),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const rules = SUBCATEGORY_RULES[category] || {};

  for (const [subcategory, keywords] of Object.entries(rules)) {
    if (keywords.some((keyword) => text.includes(keyword.toLowerCase()))) {
      return subcategory;
    }
  }

  return "";
}

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
  const searchParams = useSearchParams();
  const subcategory = searchParams.get("subcategory") || "";

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

        const filtered = subcategory
          ? data.filter(
              (product) =>
                getAutomaticSubcategory(product, name) === subcategory
            )
          : data;

        if (!cancelled) {
          setProducts(shuffleProducts(filtered));
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
  }, [name, subcategory]);

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
                {subcategory
                  ? `Showing ${subcategory} products`
                  : "Explore products in this category"}
              </p>
            </div>
          </div>

          {Object.keys(SUBCATEGORY_RULES[name] || {}).length > 0 && (
            <div className="mb-6 overflow-x-auto scrollbar-hide">
              <div className="flex min-w-max gap-1 rounded-xl bg-white p-1.5 shadow-sm sm:gap-2 sm:p-2">
                <button
                  type="button"
                  onClick={() => {
                    router.push(`/category/${encodeURIComponent(name)}`);
                  }}
                  className={`rounded-full px-2.5 py-1.5 text-[10px] font-black transition sm:px-4 sm:py-2 sm:text-[11px] ${
                    !subcategory
                      ? "bg-[#E30613] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All
                </button>

                {Object.keys(SUBCATEGORY_RULES[name] || {}).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      router.push(
                        `/category/${encodeURIComponent(name)}?subcategory=${encodeURIComponent(item)}`
                      );
                    }}
                    className={`rounded-full px-2.5 py-1.5 text-[10px] font-black transition sm:px-4 sm:py-2 sm:text-[11px] ${
                      subcategory === item
                        ? "bg-[#E30613] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

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
