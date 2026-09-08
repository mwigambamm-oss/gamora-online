"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { useRouter } from "next/navigation";
import { FaFacebookF, FaInstagram, FaTiktok } from "react-icons/fa";
import { translations, type Language } from "@/lib/translations";
import { formatCurrency, type Currency } from "@/lib/currency";
import { getProducts as getSupabaseProducts, type Product } from "@/lib/products";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";

type CartItem = Product & { quantity: number };

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
  "Tools & Hardware": "/images/categories/automotive.jpg",
  "Books & Stationery": "/images/categories/books.jpg",
  "Jewelry & Watches": "/images/categories/jewelry.jpg",
  Furniture: "/images/categories/furniture.jpg",
  "Garden & Outdoor": "/images/categories/garden.jpg",
  "Health & Wellness": "/images/categories/health.jpg",
  Gaming: "/images/categories/gaming.jpg",
};

const CATEGORY_ICONS: Record<string, string> = {
  "Women's Fashion": "👗",
  "Men's Fashion": "👔",
  Shoes: "👟",
  "Phones & Electronics": "📱",
  "Home & Kitchen": "🏠",
  Accessories: "👜",
  "Beauty & Personal Care": "💄",
  "Computers & Accessories": "💻",
  "Baby & Kids": "🧸",
  "Sports & Fitness": "🏋️",
  Automotive: "🚗",
  "Tools & Hardware": "🔧",
  "Books & Stationery": "📚",
  "Jewelry & Watches": "💍",
  Furniture: "🛋️",
  "Garden & Outdoor": "🌿",
  "Health & Wellness": "🩺",
  Gaming: "🎮",
};

const ALL_CATEGORIES = [
  "Women's Fashion",
  "Men's Fashion",
  "Shoes",
  "Phones & Electronics",
  "Home & Kitchen",
  "Accessories",
  "Beauty & Personal Care",
  "Computers & Accessories",
  "Baby & Kids",
  "Sports & Fitness",
  "Automotive",
  "Tools & Hardware",
  "Books & Stationery",
  "Jewelry & Watches",
  "Furniture",
  "Garden & Outdoor",
  "Health & Wellness",
  "Gaming",
];

export default function HomePage() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();

  const [currency, setCurrency] = useState<Currency>("TZS");
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cartCount, setCartCount] = useState(0);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [notice, setNotice] = useState("");
  const [flashTime, setFlashTime] = useState("00:00:00");

  const flashRef = useRef<HTMLDivElement>(null);
  const trendingRef = useRef<HTMLDivElement>(null);
  const newRef = useRef<HTMLDivElement>(null);
  const bestRef = useRef<HTMLDivElement>(null);

  const t = translations[language];

  useEffect(() => {
    const saved = localStorage.getItem("gamora_currency");

    if (saved === "TZS" || saved === "USD") {
      setCurrency(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("gamora_currency", currency);
  }, [currency]);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const end = new Date(now);

      end.setHours(23, 59, 59, 999);

      const diff = Math.max(0, end.getTime() - now.getTime());

      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      setFlashTime(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
          2,
          "0"
        )}:${String(seconds).padStart(2, "0")}`
      );
    };

    update();

    const timer = window.setInterval(update, 1000);

  

  const marqueeStyle = `
    @keyframes gamora-marquee {
      from { transform: translateX(0); }
      to { transform: translateX(-50%); }
    }

    .gamora-marquee {
      animation: gamora-marquee 22s linear infinite;
    }

    .gamora-marquee:hover {
      animation-play-state: paused;
    }
  `;



  return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        const data = await getSupabaseProducts();

        if (active) {
          setProducts(data);
        }
      } catch (error) {
        console.error("Failed to load products:", error);

        if (active) {
          setProducts([]);
        }
      }
    }

    loadProducts();
    updateCartCount();

    const update = () => updateCartCount();

    window.addEventListener("storage", update);
    window.addEventListener("gamora-cart-updated", update);

    return () => {
      active = false;
      window.removeEventListener("storage", update);
      window.removeEventListener("gamora-cart-updated", update);
    };
  }, []);

  useEffect(() => {
    if (heroPaused || heroSlides.length <= 1) return;

    const timer = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroSlides.length);
    }, 5500);

    return () => window.clearInterval(timer);
  });

  function updateCartCount() {
    const saved = localStorage.getItem("gamora_cart");

    if (!saved) {
      setCartCount(0);
      return;
    }

    try {
      const cart: CartItem[] = JSON.parse(saved);

      setCartCount(
        cart.reduce(
          (total, item) => total + Number(item.quantity || 0),
          0
        )
      );
    } catch {
      setCartCount(0);
    }
  }

  function changeLanguage(next: Language) {
    setLanguage(next);
    window.dispatchEvent(new Event("gamora-language-changed"));
  }

  function addToCart(product: Product) {
    const saved = localStorage.getItem("gamora_cart");

    let cart: CartItem[] = [];

    if (saved) {
      try {
        cart = JSON.parse(saved);
      } catch {
        cart = [];
      }
    }

    const existingIndex = cart.findIndex(
      (item) => item.id === product.id
    );

    if (existingIndex >= 0) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({
        ...product,
        quantity: 1,
      });
    }

    localStorage.setItem("gamora_cart", JSON.stringify(cart));

    updateCartCount();

    window.dispatchEvent(new Event("gamora-cart-updated"));

    setNotice(
      language === "sw"
        ? `${product.name} imeongezwa kwenye kikapu.`
        : `${product.name} has been added to your cart.`
    );

    window.setTimeout(() => setNotice(""), 2200);
  }

  function scrollCarousel(
    ref: RefObject<HTMLDivElement | null>,
    direction: number
  ) {
    const el = ref.current;

    if (!el) return;

    el.scrollBy({
      left:
        direction *
        Math.max(320, Math.floor(el.clientWidth * 0.9)),
      behavior: "smooth",
    });
  }

  const categories = useMemo(() => {
    const found = Array.from(
      new Set(
        products
          .map((product) => product.category)
          .filter(Boolean)
      )
    );

    const extra = found.filter(
      (name) => !ALL_CATEGORIES.includes(name)
    );

    return [...ALL_CATEGORIES, ...extra];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = search.toLowerCase().trim();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query);

      const matchesCategory =
        selectedCategory === "All" ||
        product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  const deals = useMemo(
    () =>
      [...filteredProducts]
        .filter((product) => getDiscount(product) > 0)
        .sort(
          (a, b) => getDiscount(b) - getDiscount(a)
        )
        .slice(0, 20),
    [filteredProducts]
  );

  const trending = useMemo(
    () =>
      [...filteredProducts]
        .sort(
          (a, b) =>
            Number(b.orders_count || 0) -
            Number(a.orders_count || 0)
        )
        .slice(0, 20),
    [filteredProducts]
  );

  const newArrivals = useMemo(
    () =>
      [...filteredProducts]
        .sort((a, b) => Number(b.id) - Number(a.id))
        .slice(0, 20),
    [filteredProducts]
  );

  const bestSellers = useMemo(
    () =>
      [...filteredProducts]
        .sort(
          (a, b) =>
            Number(b.orders_count || 0) -
            Number(a.orders_count || 0)
        )
        .slice(0, 20),
    [filteredProducts]
  );

  const categoryProducts = useMemo(() => {
    const result: Record<string, Product[]> = {};

    ALL_CATEGORIES.forEach((category) => {
      result[category] = products
        .filter(
          (product) => product.category === category
        )
        .slice(0, 12);
    });

    return result;
  }, [products]);

  const heroProducts = useMemo(
    () =>
      products
        .filter((product) => getProductImage(product))
        .slice(0, 5),
    [products]
  );

  const heroSlides = [
    {
      eyebrow:
        language === "sw"
          ? "KARIBU GAMORA ONLINE"
          : "WELCOME TO GAMORA ONLINE",
      title:
        language === "sw"
          ? "Nunua smart. Chagua Gamora."
          : "Shop smart. Choose Gamora.",
      text:
        language === "sw"
          ? "Gundua maelfu ya bidhaa kwa bei nzuri na uzoefu rahisi wa kununua."
          : "Discover great products at great prices with a simple shopping experience.",
      button:
        language === "sw" ? "ANZA KUNUNUA" : "SHOP NOW",
      product: heroProducts[0],
    },
    {
      eyebrow:
        language === "sw"
          ? "BIDHAA MPYA"
          : "NEW ARRIVALS",
      title:
        language === "sw"
          ? "Vitu vipya vimefika."
          : "Fresh finds have arrived.",
      text:
        language === "sw"
          ? "Gundua bidhaa mpya zilizowekwa kwenye Gamora."
          : "Explore the latest products added to Gamora.",
      button:
        language === "sw"
          ? "ANGALIA MPYA"
          : "EXPLORE NEW",
      product:
        heroProducts[1] || heroProducts[0],
    },
    {
      eyebrow:
        language === "sw"
          ? "FLASH DEALS"
          : "FLASH DEALS",
      title:
        language === "sw"
          ? "Ofa kali za leo."
          : "Today's biggest deals.",
      text:
        language === "sw"
          ? "Pata punguzo kwenye bidhaa zilizochaguliwa kabla muda haujaisha."
          : "Save more on selected products before the deals end.",
      button:
        language === "sw"
          ? "ANGALIA OFA"
          : "VIEW DEALS",
      product:
        deals[0] ||
        heroProducts[2] ||
        heroProducts[0],
    },
  ];

  const hero = heroSlides[heroIndex] || heroSlides[0];

  function goCategory(category: string) {
    router.push(
      `/category/${encodeURIComponent(category)}`
    );
  }

  function handleHeroButton() {
    if (hero.product) {
      router.push(`/product/${hero.product.id}`);
      return;
    }

    document
      .getElementById("products")
      ?.scrollIntoView({
        behavior: "smooth",
      });
  }

  return (
    <main className="min-h-screen bg-[#f3f4f6] text-[#1f2937]">
      <style>{`
        @keyframes gamora-marquee {
          from { transform: translateX(100vw); }
          to { transform: translateX(-100%); }
        }
      `}</style>
      {notice && (
        <div className="fixed left-1/2 top-5 z-[100] -translate-x-1/2 rounded-full bg-[#1f2937] px-5 py-3 text-xs font-bold text-white shadow-2xl sm:text-sm">
          ✓ {notice}
        </div>
      )}

      {/* ANNOUNCEMENT */}
      <div className="bg-[#1f2937] text-white">
        <div className="mx-auto max-w-[1440px] overflow-hidden">
          <div className="flex min-h-[38px] w-max items-center whitespace-nowrap text-[11px] font-bold sm:text-xs animate-[gamora-marquee_18s_linear_infinite]">
            {language === "sw"
              ? "Karibu Gamora Online • Ofa kubwa • Bidhaa nyingi • Nunua kwa urahisi na usalama"
              : "Welcome to Gamora Online • Great deals • Thousands of products • Shop easily and securely"}
          </div>
        </div>
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1440px] px-3 sm:px-5">
          <div className="flex min-h-[70px] items-center gap-3 lg:gap-7">
            <button
              onClick={() => router.push("/")}
              className="shrink-0"
            >
            </button>

            <div className="hidden lg:block">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                Gamora Online
              </p>
              <p className="text-xs font-bold text-slate-700">
                {language === "sw"
                  ? "Soko lako la mtandaoni"
                  : "Your online marketplace"}
              </p>
            </div>

            {/* BIG SEARCH */}
            <div className="relative hidden flex-1 lg:block">
              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder={
                  language === "sw"
                    ? "Unatafuta nini leo?"
                    : "What are you looking for today?"
                }
                className="h-11 w-full rounded-full border-2 border-[#2563eb] bg-white px-5 pr-14 text-sm outline-none transition focus:shadow-lg"
              />

              <button
                type="button"
                className="absolute right-1 top-1 flex h-9 w-12 items-center justify-center rounded-full bg-[#2563eb] text-lg text-white"
              >
                ⌕
              </button>
            </div>

            {/* LANGUAGE */}
            <div className="hidden items-center rounded-lg border border-slate-200 p-1 sm:flex">
              <button
                onClick={() => changeLanguage("en")}
                className={`rounded-md px-2.5 py-1.5 text-[10px] font-black ${
                  language === "en"
                    ? "bg-[#1f2937] text-white"
                    : "text-slate-500"
                }`}
              >
                EN
              </button>

              <button
                onClick={() => changeLanguage("sw")}
                className={`rounded-md px-2.5 py-1.5 text-[10px] font-black ${
                  language === "sw"
                    ? "bg-[#1f2937] text-white"
                    : "text-slate-500"
                }`}
              >
                SW
              </button>
            </div>

            {/* CURRENCY */}
            <div className="hidden items-center rounded-lg border border-slate-200 p-1 md:flex">
              <button
                onClick={() => setCurrency("TZS")}
                className={`rounded-md px-2 py-1.5 text-[10px] font-black ${
                  currency === "TZS"
                    ? "bg-[#2563eb] text-white"
                    : "text-slate-500"
                }`}
              >
                TZS
              </button>

              <button
                onClick={() => setCurrency("USD")}
                className={`rounded-md px-2 py-1.5 text-[10px] font-black ${
                  currency === "USD"
                    ? "bg-[#2563eb] text-white"
                    : "text-slate-500"
                }`}
              >
                USD
              </button>
            </div>

            {/* ACCOUNT */}
            <button
              onClick={() => router.push("/account")}
              className="hidden text-left lg:block"
            >
              <p className="text-[10px] text-slate-300">
                {language === "sw"
                  ? "Karibu"
                  : "Welcome"}
              </p>
              <p className="text-xs font-black text-slate-800">
                {language === "sw"
                  ? "Akaunti"
                  : "Account"}
              </p>
            </button>

            {/* CART */}
            <button
              onClick={() => router.push("/cart")}
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 text-xl transition hover:bg-slate-50"
              aria-label="Cart"
            >
              🛒

              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[10px] font-black text-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          {/* MOBILE SEARCH */}
          <div className="pb-3 lg:hidden">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder={
                    language === "sw"
                      ? "Tafuta bidhaa..."
                      : "Search products..."
                  }
                  className="h-10 w-full rounded-full border border-slate-300 px-4 pr-12 text-xs outline-none focus:border-[#2563eb]"
                />

                <span className="absolute right-4 top-1/2 -translate-y-1/2">
                  ⌕
                </span>
              </div>

              <button
                onClick={() => setCurrency(currency === "TZS" ? "USD" : "TZS")}
                className="rounded-full border border-slate-300 px-3 text-[10px] font-black"
              >
                {currency}
              </button>

              <button
                onClick={() => router.push("/account")}
                className="rounded-full border border-slate-300 px-3 text-[10px] font-black"
              >
                👤
                <span className="ml-1">
                  {language === "sw" ? "Akaunti" : "Account"}
                </span>
              </button>

              <button
                onClick={() => router.push("/account")}
                className="rounded-full border border-slate-300 px-3 text-[10px] font-black"
              >
                👤
                <span className="ml-1">
                  {language === "sw" ? "Akaunti" : "Account"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* NAVIGATION */}
        <div className="border-t border-slate-100 bg-white">
          <div className="mx-auto flex max-w-[1440px] items-center gap-6 overflow-x-auto px-4 py-3 scrollbar-hide">
            <button
              onClick={() => router.push("/")}
              className="shrink-0 text-xs font-black text-[#2563eb]"
            >
              {language === "sw"
                ? "NYUMBANI"
                : "HOME"}
            </button>

            <button
              onClick={() =>
                document
                  .getElementById("categories")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="shrink-0 text-xs font-bold text-slate-600"
            >
              {language === "sw"
                ? "MAKUNDI"
                : "CATEGORIES"}
            </button>

            <button
              onClick={() =>
                document
                  .getElementById("flash-sales")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="shrink-0 text-xs font-bold text-slate-600"
            >
              🔥 {language === "sw" ? "OFA" : "FLASH DEALS"}
            </button>

            <button
              onClick={() =>
                document
                  .getElementById("new-arrivals")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="shrink-0 text-xs font-bold text-slate-600"
            >
              {language === "sw"
                ? "MPYA"
                : "NEW ARRIVALS"}
            </button>

            <button
              onClick={() =>
                document
                  .getElementById("best-sellers")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="shrink-0 text-xs font-bold text-slate-600"
            >
              {language === "sw"
                ? "ZINAZOUZWA SANA"
                : "BEST SELLERS"}
            </button>

            <button
              onClick={() => router.push("/contact")}
              className="shrink-0 text-xs font-bold text-slate-600"
            >
              {language === "sw"
                ? "WASILIANA NASI"
                : "CONTACT US"}
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section
        className="bg-[#eef2ff] py-4 sm:py-6"
        onMouseEnter={() => setHeroPaused(true)}
        onMouseLeave={() => setHeroPaused(false)}
      >
        <div className="mx-auto max-w-[1440px] px-3 sm:px-5">
          <div className="grid overflow-hidden rounded-2xl bg-white shadow-sm lg:grid-cols-[250px_1fr_270px]">
            
            {/* LEFT CATEGORIES */}
            <aside className="hidden border-r border-slate-100 bg-white lg:block">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-sm font-black text-slate-900">
                  {language === "sw"
                    ? "Makundi yote"
                    : "All Categories"}
                </h2>
              </div>

              <div className="py-2">
                {ALL_CATEGORIES.slice(0, 12).map(
                  (category) => (
                    <button
                      key={category}
                      onClick={() =>
                        goCategory(category)
                      }
                      className="flex w-full items-center gap-3 px-5 py-2.5 text-left text-xs font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-[#2563eb]"
                    >
                      <span className="flex h-8 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-50">
                        {CATEGORY_IMAGES[category] ? (
                          <img
                            src={CATEGORY_IMAGES[category]}
                            alt={category}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <img
                            src={
                              category === "Women's Fashion"
                                ? "/images/womens-fashion.jpg"
                                : category === "Men's Fashion"
                                ? "/images/mens-fashion.jpg"
                                : category === "Shoes"
                                ? "/images/shoes.jpg"
                                : category === "Phones & Electronics"
                                ? "/images/phone.jpg"
                                : category === "Home & Kitchen"
                                ? "/images/categories/kitchen.jpg"
                                : category === "Accessories"
                                ? "/images/categories/jewelry.jpg"
                                : category === "Beauty & Personal Care"
                                ? "/images/categories/beauty.jpg"
                                : category === "Computers & Accessories"
                                ? "/images/categories/computers.jpg"
                                : category === "Baby & Kids"
                                ? "/images/categories/baby.jpg"
                                : category === "Sports & Fitness"
                                ? "/images/categories/sports.jpg"
                                : category === "Automotive"
                                ? "/images/categories/automotive.jpg"
                                : category === "Tools & Hardware"
                                ? "/images/categories/garden.jpg"
                                : "/images/categories/furniture.jpg"
                            }
                            alt={category}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </span>

                      <span className="flex-1 truncate">
                        {category}
                      </span>

                      <span>›</span>
                    </button>
                  )
                )}
              </div>
            </aside>

            {/* HERO CENTER */}
            <div className="relative min-h-[360px] overflow-hidden bg-gradient-to-br from-[#eff6ff] via-white to-[#dbeafe] sm:min-h-[430px]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(37,99,235,.15),transparent_45%)]" />

              <div className="relative grid h-full items-center gap-5 px-7 py-8 sm:px-12 lg:grid-cols-2 lg:px-10">
                <div className="z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#2563eb] sm:text-xs">
                    {hero.eyebrow}
                  </p>

                  <h1 className="mt-3 max-w-xl text-4xl font-black leading-[0.98] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                    {hero.title}
                  </h1>

                  <p className="mt-5 max-w-lg text-sm leading-6 text-slate-600 sm:text-base">
                    {hero.text}
                  </p>

                  <button
                    onClick={handleHeroButton}
                    className="mt-7 rounded-lg bg-[#2563eb] px-6 py-3.5 text-xs font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#1d4ed8]"
                  >
                    {hero.button} →
                  </button>
                </div>

                <div className="relative flex h-full min-h-[210px] items-center justify-center">
                  <div className="absolute h-60 w-60 rounded-full bg-white/80 blur-3xl sm:h-80 sm:w-80" />

                  {hero.product &&
                  getProductImage(hero.product) ? (
                    <img
                      src={getProductImage(hero.product)}
                      alt={hero.product.name}
                      className="relative z-10 max-h-[270px] max-w-[90%] object-contain drop-shadow-2xl transition-all duration-700 sm:max-h-[350px]"
                    />
                  ) : (
                    <div className="text-8xl opacity-30">
                      🛍️
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() =>
                  setHeroIndex(
                    (heroIndex -
                      1 +
                      heroSlides.length) %
                      heroSlides.length
                  )
                }
                className="absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-xl shadow-lg"
              >
                ‹
              </button>

              <button
                onClick={() =>
                  setHeroIndex(
                    (heroIndex + 1) %
                      heroSlides.length
                  )
                }
                className="absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-xl shadow-lg"
              >
                ›
              </button>

              <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
                {heroSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      setHeroIndex(index)
                    }
                    className={`h-2 rounded-full transition-all ${
                      heroIndex === index
                        ? "w-7 bg-[#2563eb]"
                        : "w-2 bg-slate-300"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="hidden bg-[#1f2937] p-6 text-white lg:block">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-300">
                Gamora Online
              </p>

              <h3 className="mt-3 text-2xl font-black leading-tight">
                {language === "sw"
                  ? "Pata bidhaa zako kwa bei nzuri."
                  : "Find your products at great prices."}
              </h3>

              <div className="mt-7 rounded-xl bg-white/10 p-4">
                <p className="text-[10px] font-bold uppercase text-slate-300">
                  🔥 {language === "sw" ? "Flash Sale" : "Flash Sale"}
                </p>

                <p className="mt-2 font-mono text-2xl font-black">
                  {flashTime}
                </p>

                <button
                  onClick={() =>
                    document
                      .getElementById("flash-sales")
                      ?.scrollIntoView({
                        behavior: "smooth",
                      })
                  }
                  className="mt-4 w-full rounded-lg bg-white py-3 text-xs font-black text-[#111827] shadow-md transition hover:bg-blue-50 hover:text-[#2563eb]"
                >
                  {language === "sw"
                    ? "ANGALIA OFA"
                    : "SHOP DEALS"}
                </button>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-white/10 p-3">
                  <img
                    src="/images/delivery-van.jpg"
                    alt="Delivery"
                    className="mx-auto h-10 w-14 rounded-md object-cover"
                  />
                  <p className="mt-1 text-[10px] font-bold">
                    {language === "sw"
                      ? "Delivery"
                      : "Delivery"}
                  </p>
                </div>

                <div className="rounded-lg bg-white/10 p-3">
                  <img
                    src="/images/secure-payment.jpg"
                    alt="Secure payment"
                    className="mx-auto h-10 w-14 rounded-md object-cover"
                  />
                  <p className="mt-1 text-[10px] font-bold">
                    {language === "sw"
                      ? "Salama"
                      : "Secure"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY STRIP */}
      <section
        id="categories"
        className="bg-white py-7 sm:py-10"
      >
        <div className="mx-auto max-w-[1440px] px-4 sm:px-5">
          <SectionHeading
            title={
              language === "sw"
                ? "Nunua kwa makundi"
                : "Shop by Category"
            }
            subtitle={
              language === "sw"
                ? "Chagua kundi unalotaka."
                : "Explore our popular categories."
            }
          />

          <div className="mt-6 flex gap-4 overflow-x-auto pb-3 scrollbar-hide lg:grid lg:grid-cols-9 lg:overflow-visible">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => goCategory(category)}
                className="group min-w-[110px] text-center"
              >
                <div className="mx-auto h-20 w-20 overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm transition group-hover:-translate-y-1 group-hover:border-blue-300 group-hover:shadow-md sm:h-24 sm:w-24">
                  {CATEGORY_IMAGES[category] ? (
                    <img
                      src={CATEGORY_IMAGES[category]}
                      alt={category}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-3xl">
                      {CATEGORY_ICONS[category] || "🛍️"}
                    </div>
                  )}
                </div>

                <p className="mt-2 line-clamp-2 text-[10px] font-bold text-slate-700 sm:text-xs">
                  {category}
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FLASH DEALS */}
      <section
        id="flash-sales"
        className="bg-[#f3f4f6] py-8 sm:py-12"
      >
        <div className="mx-auto max-w-[1440px] px-4 sm:px-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <SectionHeading
                  title="🔥 Flash Deals"
                  subtitle={
                    language === "sw"
                      ? "Ofa za muda mfupi."
                      : "Limited-time deals."
                  }
                />

                <div className="rounded-lg bg-[#1f2937] px-3 py-2 text-white">
                  <p className="text-[8px] font-bold uppercase text-slate-300">
                    {language === "sw"
                      ? "Inaisha ndani"
                      : "Ends in"}
                  </p>
                  <p className="font-mono text-sm font-black">
                    {flashTime}
                  </p>
                </div>
              </div>
            </div>

            <CarouselArrows
              onPrev={() =>
                scrollCarousel(flashRef, -1)
              }
              onNext={() =>
                scrollCarousel(flashRef, 1)
              }
            />
          </div>

          {deals.length > 0 ? (
            <Carousel carouselRef={flashRef}>
              {deals.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  addToCart={addToCart}
                  currency={currency}
                  language={language}
                />
              ))}
            </Carousel>
          ) : (
            <EmptySection
              text={
                language === "sw"
                  ? "Hakuna ofa kwa sasa."
                  : "No active deals right now."
              }
            />
          )}
        </div>
      </section>

      {/* TRENDING */}
      <section className="bg-white py-8 sm:py-12">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-5">
          <div className="flex items-end justify-between">
            <SectionHeading
              title={
                language === "sw"
                  ? "🔥 Zinazotrend"
                  : "🔥 Trending Now"
              }
              subtitle={
                language === "sw"
                  ? "Bidhaa zinazopendwa sasa."
                  : "Products customers are loving right now."
              }
            />

            <CarouselArrows
              onPrev={() =>
                scrollCarousel(trendingRef, -1)
              }
              onNext={() =>
                scrollCarousel(trendingRef, 1)
              }
            />
          </div>

          <Carousel carouselRef={trendingRef}>
            {trending.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                addToCart={addToCart}
                currency={currency}
                language={language}
              />
            ))}
          </Carousel>
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section
        id="new-arrivals"
        className="bg-[#f3f4f6] py-8 sm:py-12"
      >
        <div className="mx-auto max-w-[1440px] px-4 sm:px-5">
          <div className="flex items-end justify-between">
            <SectionHeading
              title={
                language === "sw"
                  ? "✨ Bidhaa Mpya"
                  : "✨ New Arrivals"
              }
              subtitle={
                language === "sw"
                  ? "Bidhaa zilizoongezwa hivi karibuni."
                  : "Fresh products added recently."
              }
            />

            <CarouselArrows
              onPrev={() =>
                scrollCarousel(newRef, -1)
              }
              onNext={() =>
                scrollCarousel(newRef, 1)
              }
            />
          </div>

          <Carousel carouselRef={newRef}>
            {newArrivals.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                addToCart={addToCart}
                currency={currency}
                language={language}
              />
            ))}
          </Carousel>
        </div>
      </section>

      {/* BEST SELLERS */}
      <section
        id="best-sellers"
        className="bg-white py-8 sm:py-12"
      >
        <div className="mx-auto max-w-[1440px] px-4 sm:px-5">
          <div className="flex items-end justify-between">
            <SectionHeading
              title={
                language === "sw"
                  ? "🏆 Zinazouzwa Sana"
                  : "🏆 Best Sellers"
              }
              subtitle={
                language === "sw"
                  ? "Bidhaa zinazopendwa zaidi."
                  : "Customer favorites."
              }
            />

            <CarouselArrows
              onPrev={() =>
                scrollCarousel(bestRef, -1)
              }
              onNext={() =>
                scrollCarousel(bestRef, 1)
              }
            />
          </div>

          <Carousel carouselRef={bestRef}>
            {bestSellers.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                addToCart={addToCart}
                bestSeller
                currency={currency}
                language={language}
              />
            ))}
          </Carousel>
        </div>
      </section>

      {/* CATEGORY SECTIONS */}
      {ALL_CATEGORIES.map((category) => {
        const categoryItems =
          categoryProducts[category] || [];

        if (categoryItems.length === 0) {
          return null;
        }

        return (
          <section
            key={category}
            className="border-t border-slate-100 bg-[#f3f4f6] py-8 sm:py-12"
          >
            <div className="mx-auto max-w-[1440px] px-4 sm:px-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {CATEGORY_ICONS[category]}
                    </span>

                    <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                      {category}
                    </h2>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    {language === "sw"
                      ? `Bidhaa za ${category}`
                      : `Explore ${category}`}
                  </p>
                </div>

                <button
                  onClick={() => goCategory(category)}
                  className="shrink-0 rounded-full border border-slate-300 bg-white px-4 py-2 text-[10px] font-black text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
                >
                  {language === "sw"
                    ? "ONA ZOTE →"
                    : "VIEW ALL →"}
                </button>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6">
                {categoryItems.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    addToCart={addToCart}
                    currency={currency}
                    language={language}
                  />
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* LONG PRODUCT FEED */}
      <section
        id="products"
        className="bg-white py-10 sm:py-14"
      >
        <div className="mx-auto max-w-[1440px] px-4 sm:px-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                {selectedCategory !== "All"
                  ? selectedCategory
                  : language === "sw"
                  ? "Bidhaa Zote"
                  : "More Products"}
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {search
                  ? `${filteredProducts.length} ${
                      language === "sw"
                        ? "bidhaa zimepatikana"
                        : "products found"
                    }`
                  : language === "sw"
                  ? "Endelea kugundua bidhaa zaidi."
                  : "Keep exploring more products."}
              </p>
            </div>

            {selectedCategory !== "All" && (
              <button
                onClick={() =>
                  setSelectedCategory("All")
                }
                className="rounded-full border border-slate-300 px-4 py-2 text-[10px] font-black"
              >
                {language === "sw"
                  ? "ONDOA FILTER"
                  : "CLEAR FILTER"}{" "}
                ×
              </button>
            )}
          </div>

          {filteredProducts.length > 0 ? (
            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  addToCart={addToCart}
                  currency={currency}
                  language={language}
                />
              ))}
            </div>
          ) : (
            <EmptySection text={t.noProducts} />
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-[#1f2937] py-10 text-white">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-5">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <img
                src="/gamora-logo.png"
                alt="Gamora Online"
                className="h-14 w-auto rounded bg-white px-2"
              />

              <p className="mt-4 max-w-xs text-xs leading-5 text-slate-200">
                {language === "sw"
                  ? ""
                  : "Gamora Online — shop smart, choose Gamora."}
              </p>

              <div className="mt-5 flex gap-2">
                <SocialButton
                  label="Facebook"
                  icon={<FaFacebookF />}
                />
                <SocialButton
                  label="Instagram"
                  icon={<FaInstagram />}
                />
                <SocialButton
                  label="TikTok"
                  icon={<FaTiktok />}
                />
              </div>
            </div>

            <FooterColumn
              title={
                language === "sw"
                  ? "Duka"
                  : "Shop"
              }
              links={[
                [
                  language === "sw"
                    ? "Makundi"
                    : "Categories",
                  "#categories",
                ],
                [
                  language === "sw"
                    ? "Bidhaa Mpya"
                    : "New Arrivals",
                  "#new-arrivals",
                ],
                [
                  language === "sw"
                    ? "Ofa"
                    : "Deals",
                  "#flash-sales",
                ],
                [
                  language === "sw"
                    ? "Zinazouzwa Sana"
                    : "Best Sellers",
                  "#best-sellers",
                ],
              ]}
            />

            <FooterColumn
              title={
                language === "sw"
                  ? "Mteja"
                  : "Customer"
              }
              links={[
                [
                  language === "sw"
                    ? "Akaunti"
                    : "Account",
                  "/account",
                ],
                [
                  language === "sw"
                    ? "Oda Zangu"
                    : "My Orders",
                  "/orders",
                ],
                [
                  language === "sw"
                    ? "Wishlist"
                    : "Wishlist",
                  "/wishlist",
                ],
                [
                  language === "sw"
                    ? "Kikapu"
                    : "Cart",
                  "/cart",
                ],
              ]}
            />

            <FooterColumn
              title={
                language === "sw"
                  ? "Msaada"
                  : "Support"
              }
              links={[
                [
                  language === "sw"
                    ? "Jinsi ya Kununua"
                    : "How to Buy",
                  "/help",
                ],
                [
                  language === "sw"
                    ? "Delivery"
                    : "Delivery Policy",
                  "/delivery",
                ],
                [
                  language === "sw"
                    ? "Masharti"
                    : "Terms & Conditions",
                  "/terms",
                ],
                [
                  language === "sw"
                    ? "Wasiliana Nasi"
                    : "Contact Us",
                  "/contact",
                ],
              ]}
            />
          </div>

          <div className="mt-10 border-t border-white/10 pt-5 text-center text-[10px] text-slate-300">
            © {new Date().getFullYear()} Gamora Online. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}

function getProductImage(product: Product) {
  return product.images?.[0] || product.image || "";
}

function getDiscount(product: Product) {
  if (
    typeof product.discount === "number" &&
    product.discount > 0
  ) {
    return product.discount;
  }

  if (
    typeof product.oldPrice === "number" &&
    product.oldPrice > product.price
  ) {
    return Math.round(
      ((product.oldPrice - product.price) /
        product.oldPrice) *
        100
    );
  }

  return 0;
}

function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <h2 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
        {title}
      </h2>

      <p className="mt-1 text-xs text-slate-500">
        {subtitle}
      </p>
    </div>
  );
}

function Carousel({
  carouselRef,
  children,
}: {
  carouselRef: RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}) {
  return (
    <div
      ref={carouselRef}
      className="mt-6 flex gap-3 overflow-x-auto pb-4 scrollbar-hide"
    >
      {children}
    </div>
  );
}

function CarouselArrows({
  onPrev,
  onNext,
}: {
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="hidden gap-2 sm:flex">
      <button
        onClick={onPrev}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-lg shadow-sm transition hover:border-blue-300 hover:text-blue-600"
      >
        ‹
      </button>

      <button
        onClick={onNext}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-lg shadow-sm transition hover:border-blue-300 hover:text-blue-600"
      >
        ›
      </button>
    </div>
  );
}

function ProductCard({
  product,
  addToCart,
  bestSeller = false,
  currency,
  language,
}: {
  product: Product;
  addToCart: (product: Product) => void;
  bestSeller?: boolean;
  currency: Currency;
  language: Language;
}) {
  const image = getProductImage(product);
  const discount = getDiscount(product);

  return (
    <article className="group relative min-w-[180px] shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:min-w-[205px] lg:min-w-0">
      <button
        type="button"
        className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-sm shadow"
        onClick={() => addToCart(product)}
        aria-label="Add to cart"
      >
        🛒
      </button>

      {discount > 0 && (
        <span className="absolute left-2 top-2 z-20 rounded-md bg-[#ef4444] px-2 py-1 text-[9px] font-black text-white">
          -{discount}%
        </span>
      )}

      {bestSeller && (
        <span className="absolute left-2 top-9 z-20 rounded-md bg-[#1f2937] px-2 py-1 text-[8px] font-black text-white">
          {language === "sw"
            ? "BEST SELLER"
            : "BEST SELLER"}
        </span>
      )}

      <button
        type="button"
        onClick={() =>
          window.location.href = `/product/${product.id}`
        }
        className="block w-full text-left"
      >
        <div className="flex h-[145px] items-center justify-center overflow-hidden bg-white sm:h-[160px]">
          {image ? (
            <img
              src={image}
              alt={product.name}
              className="h-full w-full object-contain p-0 transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="text-5xl opacity-20">
              🛍️
            </div>
          )}
        </div>

        <div className="px-3 py-2">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-[#e30613]">
                {formatCurrency(
                  Number(product.price || 0),
                  currency
                )}
              </p>

              {typeof product.oldPrice ===
                "number" &&
                product.oldPrice >
                  Number(product.price || 0) && (
                  <p className="text-[9px] text-slate-400 line-through">
                    {formatCurrency(
                      product.oldPrice,
                      currency
                    )}
                  </p>
                )}
            </div>
          </div>
        </div>
      </button>

      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={() => addToCart(product)}
          className="w-full rounded-lg bg-[#2563eb] py-2 text-[9px] font-medium text-white transition hover:bg-[#1d4ed8]"
        >
          {language === "sw"
            ? "ONGEZA KIKAPUNI"
            : "ADD TO CART"}
        </button>
      </div>
    </article>
  );
}

function EmptySection({
  text,
}: {
  text: string;
}) {
  return (
    <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-300">
      {text}
    </div>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: [string, string][];
}) {
  return (
    <div>
      <h3 className="text-sm font-black text-white">
        {title}
      </h3>

      <div className="mt-4 space-y-3">
        {links.map(([label, href]) => (
          <a
            key={`${label}-${href}`}
            href={href}
            className="block text-xs font-medium text-slate-200 transition hover:text-white"
          >
            {label}
          </a>
        ))}
      </div>
    </div>
  );
}

function SocialButton({
  label,
  icon,
}: {
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href="#"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm text-white transition hover:bg-white/20"
    >
      {icon}
    </a>
  );
}
