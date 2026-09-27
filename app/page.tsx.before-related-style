"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { usePathname, useRouter } from "next/navigation";
import { FaFacebookF, FaInstagram, FaTiktok } from "react-icons/fa";
import { translations, type Language } from "@/lib/translations";
import { formatCurrency, type Currency } from "@/lib/currency";
import { getProducts as getSupabaseProducts, type Product } from "@/lib/products";
import { supabase } from "@/lib/supabase";
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
  const pathname = usePathname();

  const goToSection = (id: string) => {
    const section = document.getElementById(id);

    if (section) {
      const headerOffset = 120;
      const y =
        section.getBoundingClientRect().top +
        window.pageYOffset -
        headerOffset;

      window.scrollTo({
        top: y,
        behavior: "smooth",
      });
    }
  };
  const { language, setLanguage } = useLanguage();

  const [currency, setCurrency] = useState<Currency>("TZS");

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");

  const rotatingCategories =
    language === "sw"
      ? [
          "Mavazi ya Wanawake",
          "Mavazi ya Wanaume",
          "Viatu",
          "Simu na Elektroniki",
          "Nyumbani na Jikoni",
          "Vifaa vya Mitindo",
          "Urembo na Huduma Binafsi",
          "Kompyuta na Vifaa",
          "Watoto na Mtoto",
          "Michezo na Mazoezi",
          "Magari",
          "Zana na Vifaa",
          "Vitabu na Stationery",
          "Vito na Saa",
          "Samani",
          "Bustani na Nje",
          "Afya na Ustawi",
          "Gaming",
        ]
      : [
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

  const [categoryIndex, setCategoryIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCategoryIndex((current) =>
        (current + 1) % rotatingCategories.length
      );
    }, 2000);

    return () => window.clearInterval(interval);
  }, [language]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [visibleProductsCount, setVisibleProductsCount] = useState(100);
  const [categoryVisibleCounts, setCategoryVisibleCounts] = useState<Record<string, number>>({});
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
    if (heroPaused) return;

    const timer = window.setInterval(() => {
      setHeroIndex((current) => current + 1);
    }, 3000);

    return () => window.clearInterval(timer);
  }, [heroPaused]);

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

  useEffect(() => {
    setVisibleProductsCount(100);
    setCategoryVisibleCounts({});
  }, [search, selectedCategory]);

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
      products.filter((product) => getProductImage(product)),
    [products]
  );

  const heroSlides = useMemo(
    () =>
      heroProducts.map((product, index) => ({
        eyebrow:
          index % 4 === 0
            ? language === "sw"
              ? "🔥 INAPENDWA SANA"
              : "🔥 TRENDING NOW"
            : index % 4 === 1
              ? language === "sw"
                ? "⚡ OFA MAALUM"
                : "⚡ SPECIAL DEAL"
              : index % 4 === 2
                ? language === "sw"
                  ? "✨ CHAGUO JIPYA"
                  : "✨ NEW PICK"
                : language === "sw"
                  ? "🛍️ GAMORA PICK"
                  : "🛍️ GAMORA PICK",
        title: product.name,
        text:
          product.description
            ?.replace(/<br\s*\/?>/gi, " ")
            .replace(/<[^>]*>/g, "")
            .slice(0, 150) ||
          (language === "sw"
            ? "Gundua bidhaa hii kwenye Gamora Online."
            : "Discover this product on Gamora Online."),
        button:
          language === "sw"
            ? "ANGALIA BIDHAA"
            : "SHOP NOW",
        product,
      })),
    [heroProducts, language]
  );

  const hero =
    heroSlides.length > 0
      ? heroSlides[heroIndex % heroSlides.length]
      : {
          eyebrow: "GAMORA ONLINE",
          title:
            language === "sw"
              ? "Gundua bidhaa zetu"
              : "Discover our products",
          text:
            language === "sw"
              ? "Gundua bidhaa mbalimbali kwenye Gamora Online."
              : "Discover a wide range of products on Gamora Online.",
          button:
            language === "sw"
              ? "ANGALIA BIDHAA"
              : "SHOP NOW",
          product: null,
        };

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
    <main id="top" className="min-h-screen bg-[#f3f4f6] text-[#1f2937]">
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
      <div className="bg-gradient-to-r from-[#E30613] to-orange-500 text-white">
        <div className="mx-auto max-w-[1440px] overflow-hidden">
          <div className="gamora-marquee flex min-h-[38px] w-max items-center whitespace-nowrap text-[11px] font-bold sm:text-xs">
            {language === "sw"
              ? "Karibu Gamora Online — Gundua bidhaa unazopenda, pata bei nzuri na uagize kwa urahisi. Tunakuletea bidhaa bora hadi ulipo."
              : "Welcome to Gamora Online — Discover products you love, enjoy great prices and shop with ease. Quality products delivered to you."}
          </div>
        </div>
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-red-100 bg-white">

        {/* DESKTOP HEADER */}
        <div className="mx-auto hidden min-h-[70px] max-w-[1440px] items-center gap-4 px-3 sm:px-5 lg:flex lg:gap-6">

          <button
            onClick={() => router.push("/")}
            className="shrink-0 text-left"
          >
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#E30613]">
              Gamora Online
            </p>
            <p className="text-xs font-black bg-gradient-to-r from-[#E30613] via-orange-500 to-pink-500 bg-clip-text text-transparent">
              {language === "sw"
                ? "Soko lako la mtandaoni"
                : "Your online marketplace"}
            </p>
          </button>

          {/* DESKTOP QUICK NAV + SEARCH */}
          <div className="ml-24 flex shrink-0 items-center gap-3">

            <a
              href="#flash-sales"
              className="shrink-0 whitespace-nowrap text-[11px] font-black text-[#E30613] transition hover:underline"
            >
              🔥 Flash Deals
            </a>

            <a
              href="#flash-sales"
              className="shrink-0 whitespace-nowrap text-[11px] font-black text-slate-700 transition hover:text-[#E30613]"
            >
              Offers
            </a>

            <a
              href="#new-arrivals"
              className="shrink-0 whitespace-nowrap text-[11px] font-black text-slate-700 transition hover:text-[#E30613]"
            >
              New Arrivals
            </a>

            <a
              href="#trending"
              className="shrink-0 whitespace-nowrap text-[11px] font-black text-slate-700 transition hover:text-[#E30613]"
            >
              Trending Now
            </a>

          </div>

          <div className="relative ml-8 w-[520px]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder=""
              className="h-11 w-full rounded-full border-2 border-orange-200 bg-white px-5 pr-14 text-sm outline-none transition focus:border-[#E30613] focus:shadow-md"
            />
            
            {!search && (
              <span
                key={`desktop-${language}-${categoryIndex}`}
                className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 animate-[gamoraCategoryUp_0.5s_ease-out] text-sm text-slate-400"
              >
                {rotatingCategories[categoryIndex]}
              </span>
            )}

            <button
              type="button"
              className="absolute right-1 top-1 flex h-9 w-12 items-center justify-center rounded-full bg-[#E30613] text-lg text-white"
            >
              ⌕
            </button>
          </div>

          <div className="ml-auto mr-16 flex items-center gap-5">
            <div className="flex items-center rounded-lg border border-slate-200 p-1">
              <button
                onClick={() => changeLanguage("en")}
              className={`rounded-md px-2.5 py-1.5 text-[10px] font-black ${
                language === "en"
                  ? "bg-[#E30613] text-white"
                  : "text-slate-500"
              }`}
            >
              EN
            </button>

            <button
              onClick={() => changeLanguage("sw")}
              className={`rounded-md px-2.5 py-1.5 text-[10px] font-black ${
                language === "sw"
                  ? "bg-[#E30613] text-white"
                  : "text-slate-500"
              }`}
            >
              SW
            </button>
          </div>

          <div className="flex items-center rounded-lg border border-slate-200 p-1">
            <button
              onClick={() => setCurrency("TZS")}
              className={`rounded-md px-2 py-1.5 text-[10px] font-black ${
                currency === "TZS"
                  ? "bg-[#E30613] text-white"
                  : "text-slate-500"
              }`}
            >
              TZS
            </button>

            <button
              onClick={() => setCurrency("USD")}
              className={`rounded-md px-2 py-1.5 text-[10px] font-black ${
                currency === "USD"
                  ? "bg-[#E30613] text-white"
                  : "text-slate-500"
              }`}
            >
              USD
            </button>
          </div>

          <button
            onClick={() => router.push("/account")}
            className="shrink-0 rounded-lg px-2 py-1 text-left transition hover:bg-red-50"
          >
            <p className="text-[10px] font-bold text-slate-500">
              My Gamora
            </p>
            <p className="translate-x-1 text-xs font-black text-[#E30613]">
              Account
            </p>
          </button>

            <button
              onClick={() => router.push("/cart")}
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-red-100 bg-red-50 text-xl transition hover:border-[#E30613]"
              aria-label="Cart"
            >
              🛒

              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E30613] px-1 text-[10px] font-black text-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

        </div>

        {/* MOBILE HEADER */}
<div className="relative z-[9999999] w-full bg-gradient-to-r from-[#450a0a] via-[#991b1b] to-[#c2410c] px-2 py-2 lg:hidden">
  <div className="flex items-center gap-1.5">

    {/* SEARCH */}
    <div className="relative min-w-0 flex-1">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder=""
        className="h-8 w-full rounded-full border-0 bg-white px-3 pr-8 text-[11px] text-slate-900 outline-none"
      />
      
      {!search && (
        <span
          key={`mobile-${language}-${categoryIndex}`}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 animate-[gamoraCategoryUp_0.5s_ease-out] text-[11px] text-slate-400"
        >
          {rotatingCategories[categoryIndex]}
        </span>
      )}

      <button
        type="button"
        className="absolute right-1 top-1 flex h-6 w-7 items-center justify-center rounded-full bg-[#E30613] text-sm text-white"
      >
        ⌕
      </button>
    </div>

    {/* LANGUAGE */}
    <div className="flex shrink-0 items-center rounded-lg border border-slate-200 bg-white p-1">
      <button
        type="button"
        onClick={() => setLanguage("sw")}
        className={`rounded-md px-2 py-1.5 text-[10px] font-black ${
          language === "sw"
            ? "bg-[#E30613] text-white"
            : "text-slate-500"
        }`}
      >
        SW
      </button>

      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`rounded-md px-2 py-1.5 text-[10px] font-black ${
          language === "en"
            ? "bg-[#E30613] text-white"
            : "text-slate-500"
        }`}
      >
        EN
      </button>
    </div>

    {/* CURRENCY */}
    <div className="flex shrink-0 items-center rounded-lg border border-slate-200 bg-white p-1">
      <button
        type="button"
        onClick={() => setCurrency("TZS")}
        className={`rounded-md px-2 py-1.5 text-[10px] font-black ${
          currency === "TZS"
            ? "bg-[#E30613] text-white"
            : "text-slate-500"
        }`}
      >
        TZS
      </button>

      <button
        type="button"
        onClick={() => setCurrency("USD")}
        className={`rounded-md px-2 py-1.5 text-[10px] font-black ${
          currency === "USD"
            ? "bg-[#E30613] text-white"
            : "text-slate-500"
        }`}
      >
        USD
      </button>
    </div>

  </div>
</div>

    {/* MOBILE HEADER SEPARATOR */}
    <div className="h-0.5 w-full bg-slate-200 lg:hidden" />

    {/* MAIN NAVIGATION */}
        <div className="relative mt-0 bg-gradient-to-r from-[#450a0a] via-[#991b1b] to-[#c2410c] lg:hidden">
          <div className="mx-auto flex max-w-[1440px] items-center justify-center gap-1.5 overflow-x-auto px-2 py-1.5 scrollbar-hide">

            <a
              href="#flash-sales"
              className="relative shrink-0 cursor-pointer rounded-full px-2.5 py-1 text-[10px] font-bold text-white transition hover:bg-white/15"
            >
              🔥 {language === "sw" ? "Ofa" : "Flash Deals"}
            </a>

            <a
              href="#new-arrivals"
              className="relative shrink-0 cursor-pointer rounded-full px-2.5 py-1 text-[10px] font-bold text-white transition hover:bg-white/15"
            >
              {language === "sw" ? "Mpya" : "New Arrivals"}
            </a>

            <a
              href="#best-sellers"
              className="relative shrink-0 cursor-pointer rounded-full px-2.5 py-1 text-[10px] font-bold text-white transition hover:bg-white/15"
            >
              {language === "sw" ? "Zinazouzwa Sana" : "Best Seller"}
            </a>

            <a
              href="#trending"
              className="relative shrink-0 cursor-pointer rounded-full px-2.5 py-1 text-[10px] font-bold text-white transition hover:bg-white/15"
            >
              🔥 {language === "sw" ? "Inayotrend" : "Trending Now"}
            </a>

          </div>
        </div>

        {/* MOBILE BOTTOM NAV */}
        <div className="fixed bottom-0 left-0 right-0 z-[9999] flex h-12 items-center justify-around border-t border-slate-200 bg-white shadow-[0_-3px_12px_rgba(0,0,0,0.08)] lg:hidden">
          <a
            href="/"
            className={`flex flex-col items-center justify-center gap-0.5 text-[9px] font-semibold ${
              pathname === "/" ? "text-[#E30613]" : "text-orange-500"
            }`}
          >
            <span className="text-base leading-none">⌂</span>
            <span>{language === "sw" ? "Nyumbani" : "Home"}</span>
          </a>

          <a
            href="#categories"
            className={`flex flex-col items-center justify-center gap-0.5 text-[9px] font-semibold ${
              pathname === "/" ? "text-[#E30613]" : "text-orange-500"
            }`}
          >
            <span className="text-base leading-none">▦</span>
            <span>{language === "sw" ? "Makundi" : "Categories"}</span>
          </a>

          <a
            href="/cart"
            aria-label="Cart"
            className={`relative flex flex-col items-center justify-center gap-0.5 text-[9px] font-semibold ${
              pathname === "/cart" ? "text-[#E30613]" : "text-orange-500"
            }`}
          >
            <span className="text-base leading-none">🛒</span>
            <span>{language === "sw" ? "Kikapu" : "Cart"}</span>
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E30613] px-1 text-[8px] font-black text-orange-300">
                {cartCount}
              </span>
            )}
          </a>

          <a
            href="/account"
            className={`flex flex-col items-center justify-center gap-0.5 text-[9px] font-semibold ${
              pathname === "/account" ? "text-[#E30613]" : "text-orange-500"
            }`}
          >
            <span className="text-base leading-none">👤</span>
            <span>{language === "sw" ? "Gamora Yangu" : "My Gamora"}</span>
          </a>
        </div>

      </header>

      {/* HERO */}
      <section
        className="bg-[#eef2ff] py-4 sm:py-6"
        onMouseEnter={() => setHeroPaused(true)}
        onMouseLeave={() => setHeroPaused(false)}
      >
        <div className="mx-auto max-w-[1440px] px-3 sm:px-5">
          <div className="grid overflow-hidden rounded-xl bg-white shadow-sm lg:grid-cols-[215px_1fr] min-[1600px]:grid-cols-[320px_950px_minmax(0,1fr)] lg:gap-5">
            
            {/* LEFT CATEGORIES */}
            <aside className="hidden border-r border-slate-100 bg-white lg:block">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#E30613]">
                      GAMORA MARKETPLACE
                    </p>
                    <h2 className="mt-1 text-sm font-black text-slate-900">
                      {language === "sw"
                        ? "Nunua kwa Makundi"
                        : "Shop by Category"}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#fff1f2] px-2 py-1 text-[9px] font-bold text-[#E30613]">
                      {ALL_CATEGORIES.length}+
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        document
                          .getElementById("categories")
                          ?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className="whitespace-nowrap rounded-full bg-slate-900 px-2.5 py-1 text-[9px] font-black text-white transition hover:bg-[#E30613]"
                    >
                      {language === "sw" ? "Ona Zote →" : "View All →"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="px-3 py-3">
                <div className="mb-3 flex gap-1.5 overflow-hidden">
                  <button
                    type="button"
                    className="shrink-0 rounded-full bg-[#E30613] px-3 py-1.5 text-[9px] font-bold text-white"
                  >
                    🔥 Popular
                  </button>

                  <button
                    type="button"
                    className="shrink-0 rounded-full bg-orange-50 px-3 py-1.5 text-[9px] font-black text-orange-600"
                  >
                    ⚡ Deals
                  </button>

                  <button
                    type="button"
                    className="shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-[9px] font-black text-emerald-600"
                  >
                    ✨ New
                  </button>
                </div>

                <div className="space-y-1">
                  {ALL_CATEGORIES.slice(0, 5).map((category, index) => {
                    const fallbackImages: Record<string, string> = {
                      "Women's Fashion": "/images/womens-fashion.jpg",
                      "Men's Fashion": "/images/mens-fashion.jpg",
                      Shoes: "/images/shoes.jpg",
                      "Phones & Electronics": "/images/phone.jpg",
                      "Home & Kitchen": "/images/categories/kitchen.jpg",
                      Accessories: "/images/categories/jewelry.jpg",
                      "Beauty & Personal Care": "/images/categories/beauty.jpg",
                      "Computers & Accessories": "/images/categories/computers.jpg",
                      "Baby & Kids": "/images/categories/baby.jpg",
                      "Sports & Fitness": "/images/categories/sports.jpg",
                      Automotive: "/images/categories/automotive.jpg",
                      "Tools & Hardware": "/images/categories/garden.jpg",
                    };

                    const accents = [
                      "hover:bg-pink-50 hover:text-pink-600",
                      "hover:bg-indigo-50 hover:text-indigo-600",
                      "hover:bg-orange-50 hover:text-orange-600",
                      "hover:bg-blue-50 hover:text-blue-600",
                      "hover:bg-amber-50 hover:text-amber-600",
                      "hover:bg-purple-50 hover:text-purple-600",
                      "hover:bg-fuchsia-50 hover:text-fuchsia-600",
                      "hover:bg-cyan-50 hover:text-cyan-600",
                      "hover:bg-sky-50 hover:text-sky-600",
                      "hover:bg-emerald-50 hover:text-emerald-600",
                      "hover:bg-red-50 hover:text-red-600",
                      "hover:bg-lime-50 hover:text-lime-600",
                    ];

                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => goCategory(category)}
                        className={`group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition ${accents[index]}`}
                      >
                        <span className="relative flex h-9 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50 ring-1 ring-slate-100">
                          <img
                            src={
                              CATEGORY_IMAGES[category] ||
                              fallbackImages[category] ||
                              "/images/categories/furniture.jpg"
                            }
                            alt={category}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                          />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[11px] font-bold text-slate-700 group-hover:font-black">
                            {category}
                          </span>
                          <span className="block text-[8px] font-medium text-slate-400">
                            {language === "sw"
                              ? "Angalia bidhaa"
                              : "Explore products"}
                          </span>
                        </span>

                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-50 text-[13px] font-bold text-slate-400 transition group-hover:bg-white group-hover:text-current">
                          →
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById("categories")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="mt-2 flex w-full items-center justify-center rounded-lg bg-slate-50 py-2 text-[9px] font-black text-[#E30613] transition hover:bg-red-50"
                >
                  {language === "sw"
                    ? "VIEW MORE MAKUNDI"
                    : "VIEW MORE CATEGORIES"}{" "}
                  →
                </button>
              </div>
            </aside>

            {/* GAMORA MARKETPLACE PRODUCT BANNER */}
            <div
              className={`relative ml-0 min-h-[300px] min-[1600px]:ml-[60px] overflow-hidden sm:min-h-[340px] ${
                [
                  "bg-gradient-to-br from-red-50 via-orange-50 to-yellow-100",
                  "bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-100",
                  "bg-gradient-to-br from-purple-50 via-pink-50 to-fuchsia-100",
                  "bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100",
                  "bg-gradient-to-br from-amber-50 via-orange-50 to-red-100",
                  "bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-100",
                ][heroIndex % 6]
              }`}
              onMouseEnter={() => setHeroPaused(true)}
              onMouseLeave={() => setHeroPaused(false)}
            >
              <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/50 blur-3xl" />
              <div className="absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-white/50 blur-3xl" />

              {hero.product ? (
                <div className="relative z-10 grid h-full min-h-[300px] items-center gap-3 px-6 py-5 sm:min-h-[340px] sm:px-8 lg:grid-cols-[1fr_1fr] lg:px-8">
                  <div className="z-20">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#E30613] px-3 py-1 text-[9px] font-black uppercase tracking-wider text-white shadow-sm">
                        🔥 {language === "sw" ? "Inapendwa" : "Trending"}
                      </span>

                      <span className="rounded-full bg-orange-100 px-3 py-1 text-[9px] font-black text-orange-600">
                        ⚡ {language === "sw" ? "Ofa" : "DEAL"}
                      </span>
                    </div>

                    <p className="mt-2 text-[8px] font-black uppercase tracking-[0.2em] text-[#E30613]">
                      GAMORA ONLINE
                    </p>

                    <h1 className="mt-1 max-w-xl text-2xl font-black leading-[1.02] tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
                      {hero.product.name}
                    </h1>

                    <p className="mt-2 max-w-lg text-[10px] leading-4 text-slate-500 sm:text-xs">
                      {hero.product.description
                        ? hero.product.description
                            .replace(/<br\s*\/?>/gi, " ")
                            .replace(/<[^>]*>/g, "")
                            .slice(0, 150)
                        : hero.text}
                      {hero.product.description &&
                      hero.product.description.length > 150
                        ? "..."
                        : ""}
                    </p>

                    <div className="mt-2 flex items-end gap-3">
                      <span className="text-xl font-black text-[#E30613] sm:text-2xl">
                        {formatCurrency(Number(hero.product.price || 0), currency)}
                      </span>

                      {Number(hero.product.oldPrice || 0) >
                        Number(hero.product.price || 0) && (
                        <span className="pb-1 text-xs font-bold text-slate-400 line-through">
                          {formatCurrency(
                            Number(hero.product.oldPrice || 0),
                            currency
                          )}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[8px] font-semibold text-slate-500">
                      <span>
                        ⭐{" "}
                        {Number(hero.product.rating || 0).toFixed(1)}
                      </span>

                      <span>
                        ❤️{" "}
                        {Math.max(
                          200,
                          Number(hero.product.likes || 200)
                        )}{" "}
                        Likes
                      </span>

                      <span>
                        🛒{" "}
                        {Math.max(
                          300,
                          Number(hero.product.orders_count || 300)
                        )}{" "}
                        Ordered
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        window.location.href = `/product/${hero.product.id}`
                      }
                      className="mt-3 rounded-lg bg-[#E30613] px-5 py-2.5 text-[9px] font-bold text-white shadow-lg shadow-red-200 transition hover:-translate-y-0.5 hover:bg-red-700"
                    >
                      {language === "sw"
                        ? "ANGALIA BIDHAA"
                        : "SHOP NOW"}{" "}
                      →
                    </button>
                  </div>

                  <div className="relative flex h-full min-h-[170px] items-center justify-center">
                    <div className="absolute h-44 w-44 rounded-full bg-white/70 shadow-inner sm:h-56 sm:w-56" />

                    <div className="absolute right-4 top-4 z-20 rounded-full bg-yellow-400 px-3 py-2 text-[10px] font-black text-slate-900 shadow-md">
                      ✨ HOT
                    </div>

                    <img
                      src={getProductImage(hero.product)}
                      alt={hero.product.name}
                      className="relative z-10 max-h-[190px] max-w-[82%] object-contain drop-shadow-2xl transition-all duration-700 sm:max-h-[250px]"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex h-full min-h-[360px] items-center justify-center">
                  <span className="text-7xl opacity-30">🛍️</span>
                </div>
              )}

              <button
                type="button"
                onClick={() =>
                  setHeroIndex(
                    (heroIndex - 1 + heroSlides.length) %
                      heroSlides.length
                  )
                }
                className="absolute left-3 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-xl font-bold text-slate-700 shadow-lg transition hover:bg-[#E30613] hover:text-white"
              >
                ‹
              </button>

              <button
                type="button"
                onClick={() =>
                  setHeroIndex(
                    (heroIndex + 1) % heroSlides.length
                  )
                }
                className="absolute right-3 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-xl font-bold text-slate-700 shadow-lg transition hover:bg-[#E30613] hover:text-white"
              >
                ›
              </button>

              <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 gap-1.5">
                {heroSlides.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setHeroIndex(index)}
                    className={`h-1.5 rounded-full transition-all ${
                      heroIndex === index
                        ? "w-7 bg-[#E30613]"
                        : "w-1.5 bg-slate-300"
                    }`}
                  />
                ))}
              </div>

              <div className="absolute bottom-3 right-5 z-20 hidden text-[8px] font-bold uppercase tracking-wider text-slate-400 sm:block">
                {language === "sw"
                  ? "Bidhaa bora • Bei nzuri • Gamora"
                  : "Quality products • Great prices • Gamora"}
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
        <div className="mx-auto max-w-[1440px] px-2 sm:px-5">
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
        id="flash-sales" style={{ scrollMarginTop: "120px" }}
        className="scroll-mt-24 bg-[#fff7ed] py-8 sm:py-12"
      >
        <div className="mx-auto max-w-[1440px] px-4 sm:px-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <h2
                    style={{ color: "#E30613" }}
                    className="text-xl font-black sm:text-2xl"
                  >
                    🔥 Flash Deals
                  </h2>
                  <p
                    style={{ color: "#374151" }}
                    className="mt-1 text-xs font-semibold sm:text-sm"
                  >
                    {language === "sw"
                      ? "Ofa za muda mfupi."
                      : "Limited-time deals."}
                  </p>
                </div>

                <div className="rounded-lg bg-[#1f2937] px-3 py-2 text-white">
                  <p
                    style={{ color: "#FFFFFF" }}
                    className="!text-white text-[8px] font-black uppercase"
                  >
                    {language === "sw"
                      ? "Inaisha ndani"
                      : "Ends in"}
                  </p>
                  <p
                    style={{ color: "#FFFFFF" }}
                    className="font-mono text-sm font-black"
                  >
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
      <section id="trending" style={{ scrollMarginTop: "120px" }} className="scroll-mt-24 bg-white py-8 sm:py-12">
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
        id="new-arrivals" style={{ scrollMarginTop: "120px" }}
        className="scroll-mt-24 bg-[#f3f4f6] py-4 sm:py-12"
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
        id="best-sellers" style={{ scrollMarginTop: "120px" }}
        className="scroll-mt-24 bg-white py-8 sm:py-12"
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
                {categoryItems.slice(0, categoryVisibleCounts[category] || 50).map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    addToCart={addToCart}
                    currency={currency}
                    language={language}
                  />
                ))}
              </div>

              {(categoryVisibleCounts[category] || 50) < categoryItems.length && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() =>
                      setCategoryVisibleCounts((prev) => ({
                        ...prev,
                        [category]: (prev[category] || 50) + 50,
                      }))
                    }
                    className="rounded-full border border-[#E30613] bg-white px-6 py-2.5 text-[10px] font-black text-[#E30613] transition hover:bg-[#E30613] hover:text-white sm:px-8 sm:py-3 sm:text-xs"
                  >
                    {language === "sw"
                      ? "ONA ZAIDI →"
                      : "VIEW MORE →"}
                  </button>
                </div>
              )}
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
            <>
              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {filteredProducts.slice(0, visibleProductsCount).map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    addToCart={addToCart}
                    currency={currency}
                    language={language}
                  />
                ))}
              </div>

              {visibleProductsCount < filteredProducts.length && (
                <div className="mt-7 flex justify-center">
                  <button
                    onClick={() =>
                      setVisibleProductsCount(
                        (count) => count + 100
                      )
                    }
                    className="rounded-full border border-[#E30613] bg-white px-7 py-3 text-[10px] font-black text-[#E30613] transition hover:bg-[#E30613] hover:text-white sm:px-9 sm:text-xs"
                  >
                    {language === "sw"
                      ? "ONA ZAIDI →"
                      : "VIEW MORE →"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <EmptySection text={t.noProducts} />
          )}
        </div>
      </section>

      {/* BACK TO TOP */}
<a
  href="#top"
  aria-label="Back to top"
  className="fixed right-1 top-1/2 z-50 flex h-14 w-7 -translate-y-1/2 items-center justify-center rounded-l-lg bg-[#E30613] text-lg font-black text-white shadow-lg transition hover:bg-[#b80510]"
>
  ↑
</a>

{/* FOOTER */}
<footer className="border-t border-orange-200 bg-gradient-to-br from-[#450a0a] via-[#991b1b] to-[#c2410c] py-4 sm:py-10 text-white">
  <div className="mx-auto max-w-[1440px] px-4 sm:px-5">

    {/* MOBILE SELL ON GAMORA */}
    <div className="mb-3 rounded-lg border border-orange-300/20 bg-black/10 p-3 sm:hidden">
      <div className="text-center">
        <h3 className="text-[10px] font-bold leading-4 text-white">
          {language === "sw" ? "Unauza bidhaa?" : "Do you sell products?"}
        </h3>

        <p className="mt-1 text-[8px] leading-3.5 text-orange-100">
          {language === "sw"
            ? "Gamora Online inalenga kuwa marketplace inayowaunganisha wauzaji na wateja Tanzania."
            : "Gamora Online is building a marketplace connecting sellers with customers across Tanzania."}
        </p>


        <a
          href="/contact"
          className="mt-2 inline-flex h-7 -translate-x-3 items-center justify-center rounded-lg bg-white px-4 text-[8px] font-black text-[#991b1b]"
        >
          {language === "sw" ? "WASILIANA NASI" : "CONTACT US"}
        </a>
      </div>
    </div>

    {/* MAIN FOOTER */}
    <div className="grid grid-cols-3 items-start gap-3 py-3 translate-x-0 sm:translate-x-0 sm:gap-8 sm:py-2 md:grid-cols-4 lg:grid-cols-[0.75fr_0.75fr_1fr_3.5fr] lg:gap-x-5 lg:-translate-y-2">

      {/* SHOP */}
      <div className="translate-x-0">
        <FooterColumn
          title={language === "sw" ? "Duka" : "Shop"}
          links={[
            [language === "sw" ? "Makundi" : "Categories", "#categories"],
            [language === "sw" ? "Bidhaa Mpya" : "New Arrivals", "#new-arrivals"],
            [language === "sw" ? "Ofa" : "Deals", "#flash-sales"],
            [language === "sw" ? "Zinazouzwa Sana" : "Best Sellers", "#best-sellers"],
          ]}
        />
      </div>

      {/* CUSTOMER */}
      <div className="translate-x-0">
        <FooterColumn
          title={language === "sw" ? "Mteja" : "Customer"}
        links={[
          [language === "sw" ? "Gamora Akaunti" : "Gamora Account", "/account"],
          [language === "sw" ? "Oda Zangu" : "My Orders", "/orders"],
          [language === "sw" ? "Wishlist" : "Wishlist", "/wishlist"],
          [language === "sw" ? "Cart" : "Cart", "/cart"],
        ]}
        />
      </div>

      {/* SHOPPING GUIDE */}
      <div className="translate-x-0">
        <h3 className="text-[10px] font-bold leading-4 sm:text-sm sm:font-black">
          {language === "sw" ? "Shopping Guide" : "Shopping Guide"}
        </h3>

        <div className="mt-1 space-y-1 text-[9px] leading-3.5 text-white sm:mt-4 sm:space-y-3 sm:text-xs sm:leading-normal">
          <a href="/help" className="block whitespace-nowrap text-[8px] leading-3 hover:text-white sm:text-xs">
            {language === "sw" ? "Jinsi ya Kuagiza" : "How to Buy"}
          </a>

          <a href="/delivery" className="block hover:text-white">
            {language === "sw" ? "Delivery" : "Delivery"}
          </a>

          <a href="/terms" className="block hover:text-white">
            {language === "sw"
              ? "Masharti na Vigezo"
              : "Terms & Conditions"}
          </a>

          <a href="/contact" className="block hover:text-white">
            {language === "sw" ? "Wasiliana Nasi" : "Contact Us"}
          </a>
        </div>
      </div>

{/* FAQ */}
    <div className="hidden sm:block lg:col-span-1 lg:translate-x-0 lg:min-w-0 lg:-translate-y-1">
      <div className="mb-3">
        <h2 className="text-sm font-black">
          {language === "sw"
            ? "Maswali Yanayoulizwa Mara kwa Mara"
            : "Frequently Asked Questions"}
        </h2>

        <p className="mt-1 text-[9px] leading-4 text-orange-100">
          {language === "sw"
            ? "Majibu ya haraka kuhusu kuagiza, malipo na delivery."
            : "Quick answers about ordering, payment and delivery."}
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2 lg:gap-x-5">

        <details className="group rounded-lg bg-white/10 p-2.5">
          <summary className="cursor-pointer list-none text-xs font-bold">
            {language === "sw"
              ? "Nawezaje kuagiza bidhaa?"
              : "How can I place an order?"}
          </summary>

          <p className="mt-2 text-[9px] leading-4 text-orange-100">
            {language === "sw"
              ? "Chagua bidhaa, ongeza kwenye cart, fungua checkout, jaza taarifa zako za delivery na ukamilishe oda."
              : "Choose a product, add it to your cart, open checkout, enter your delivery details and complete your order."}
          </p>
        </details>

        <details className="group rounded-lg bg-white/10 p-2.5">
          <summary className="cursor-pointer list-none text-xs font-bold">
            {language === "sw"
              ? "Mna-deliver maeneo gani?"
              : "Where do you deliver?"}
          </summary>

          <p className="mt-2 text-[9px] leading-4 text-orange-100">
            {language === "sw"
              ? "Gamora Online inalenga delivery ndani ya Tanzania. Gharama ya delivery huathiriwa na eneo lako."
              : "Gamora Online serves customers within Tanzania. Delivery cost depends on your location."}
          </p>
        </details>

        <details className="group rounded-lg bg-white/10 p-2.5">
          <summary className="cursor-pointer list-none text-xs font-bold">
            {language === "sw"
              ? "Nitalipaje oda yangu?"
              : "How can I pay for my order?"}
          </summary>

          <p className="mt-2 text-[9px] leading-4 text-orange-100">
            {language === "sw"
              ? "Njia za malipo zinazoonekana kwenye checkout ndizo zinazopatikana kwa oda yako."
              : "The payment methods shown at checkout are the available options for your order."}
          </p>
        </details>

        <details className="group rounded-lg bg-white/10 p-2.5">
          <summary className="cursor-pointer list-none text-xs font-bold">
            {language === "sw"
              ? "Ninawezaje kufuatilia oda yangu?"
              : "How can I track my order?"}
          </summary>

          <p className="mt-2 text-[9px] leading-4 text-orange-100">
            {language === "sw"
              ? "Fungua akaunti yako na angalia sehemu ya My Orders kuona taarifa ya oda yako."
              : "Open your account and check My Orders to view your order status."}
          </p>
        </details>

        <details className="group rounded-lg bg-white/10 p-2.5">
          <summary className="cursor-pointer list-none text-xs font-bold">
            {language === "sw"
              ? "Ninaweza kuwasiliana na Gamora kupitia WhatsApp?"
              : "Can I contact Gamora through WhatsApp?"}
          </summary>

          <p className="mt-2 text-[9px] leading-4 text-orange-100">
            {language === "sw"
              ? "Ndiyo. Unaweza kutumia WhatsApp yetu kwa msaada kuhusu bidhaa na oda."
              : "Yes. You can use our WhatsApp for help with products and orders."}
          </p>
        </details>

        <details className="group rounded-lg bg-white/10 p-2.5">
          <summary className="cursor-pointer list-none text-xs font-bold">
            {language === "sw"
              ? "Ninawezaje kupata msaada?"
              : "How can I get help?"}
          </summary>

          <p className="mt-2 text-[9px] leading-4 text-orange-100">
            {language === "sw"
              ? "Tembelea Help Center, Contact Us au wasiliana nasi kupitia WhatsApp."
              : "Visit the Help Center, Contact Us page or reach us through WhatsApp."}
          </p>
        </details>
      </div>
    </div>

    </div>

    {/* MOBILE COPYRIGHT */}
    <div className="mt-2 border-t border-white/15 pt-2 pb-2 text-center sm:hidden">
      <p className="text-[10px] font-medium text-white">
        © {new Date().getFullYear()} Gamora Online. All rights reserved.
      </p>
    </div>

    {/* SELL ON GAMORA */}
    <div className="hidden sm:block rounded-xl border border-orange-300/20 bg-black/10 p-5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h3 className="text-[10px] font-bold leading-4 sm:text-sm sm:font-black">
            {language === "sw"
              ? "Unauza bidhaa?"
              : "Do you sell products?"}
          </h3>

          <p className="mt-1 max-w-2xl text-[9px] leading-4 text-orange-100 sm:text-xs sm:leading-5">
            {language === "sw"
              ? "Gamora Online inalenga kuwa marketplace inayowaunganisha wauzaji na wateja Tanzania."
              : "Gamora Online is building a marketplace connecting sellers with customers across Tanzania."}
          </p>
        </div>

        <a
          href="/contact"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-white px-4 text-[9px] font-black text-[#991b1b] transition hover:bg-orange-50 sm:h-9 sm:px-5 sm:text-[11px]"
        >
          {language === "sw" ? "WASILIANA NASI" : "CONTACT US"}
        </a>
      </div>
    </div>

    {/* COPYRIGHT — VERY BOTTOM */}
    {/* DESKTOP SOCIAL ICONS */}
    <div className="mt-3 mb-1 hidden items-center justify-center gap-3 sm:flex">

      {/* Instagram */}
      <a
        href="https://www.instagram.com/gamoraonline_store/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
        className="transition hover:scale-110"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6">
          <defs>
            <linearGradient id="ig-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F58529" />
              <stop offset="50%" stopColor="#DD2A7B" />
              <stop offset="100%" stopColor="#8134AF" />
            </linearGradient>
          </defs>
          <rect x="3" y="3" width="18" height="18" rx="5" fill="url(#ig-gradient)" />
          <circle cx="12" cy="12" r="4" fill="none" stroke="white" strokeWidth="1.8" />
          <circle cx="17.4" cy="6.6" r="1.2" fill="white" />
        </svg>
      </a>

      {/* Facebook */}
      <a
        href="#"
        aria-label="Facebook"
        className="transition hover:scale-110"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6">
          <circle cx="12" cy="12" r="10" fill="#1877F2" />
          <path
            d="M13.5 20v-7h2.3l.4-2.7h-2.7V8.6c0-.8.2-1.4 1.5-1.4h1.3V4.8c-.2 0-1-.1-1.9-.1-2.1 0-3.5 1.3-3.5 3.6v2H8.5V13h2.4v7h2.6Z"
            fill="white"
          />
        </svg>
      </a>

      {/* TikTok */}
      <a
        href="#"
        aria-label="TikTok"
        className="transition hover:scale-110"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6">
          <path
            d="M14.2 3h3c.3 1.8 1.3 3.1 2.8 3.8v3.1c-1.1-.1-2.2-.5-3.1-1.1v6.1c0 3.2-2.1 5.4-5.2 5.4-3 0-5.1-2-5.1-4.8 0-2.9 2.3-5 5.4-5.1v3.1c-1.2.1-2 .8-2 1.9 0 1.1.8 1.8 1.8 1.8 1.2 0 2-.8 2-2.3V3Z"
            fill="#25F4EE"
          />
          <path
            d="M13.2 4h2.2c.4 1.4 1.2 2.3 2.5 3v2c-.8-.2-1.5-.5-2.2-.9v6.1c0 2.6-1.5 4.5-4.2 4.5-1.2 0-2.3-.5-3-1.3.7.3 1.4.5 2.2.5 1.8 0 3-1.2 3-3.2V4Z"
            fill="#FE2C55"
          />
          <path
            d="M14.2 3h2.1c.3 1.7 1.3 3 2.7 3.7v2.1c-.8-.2-1.5-.5-2.2-.9v6.1c0 3.2-2 5.4-5.1 5.4-1.5 0-2.7-.6-3.5-1.6.6.2 1.2.3 1.8.3 2 0 3.1-1.3 3.1-3.4V3Z"
            fill="white"
          />
        </svg>
      </a>

      {/* WhatsApp */}
      <a
        href="#"
        aria-label="WhatsApp"
        className="transition hover:scale-110"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6">
          <circle cx="12" cy="12" r="10" fill="#25D366" />
          <path
            d="M16.6 13.9c-.2-.1-1.2-.6-1.4-.7-.2-.1-.3-.1-.5.1-.1.2-.5.7-.6.8-.1.2-.3.2-.5.1-1.6-.8-2.6-1.4-3.6-3.2-.1-.2 0-.3.1-.4l.3-.4c.1-.1.1-.2.2-.4 0-.1 0-.3-.1-.4-.1-.1-.5-1.2-.7-1.6-.2-.4-.4-.4-.5-.4h-.4c-.2 0-.4.1-.5.3-.2.2-.7.7-.7 1.8s.7 2.1.8 2.2c.1.2 1.4 2.2 3.4 3.1.5.2.8.3 1.1.4.5.1.9.1 1.3.1.4-.1 1.2-.5 1.4-1 .2-.5.2-1 .1-1.1-.1-.1-.2-.2-.5-.3Z"
            fill="white"
          />
        </svg>
      </a>

    </div>

    <div className="block mt-1 border-t border-white/15 pt-2 text-center text-[8px] text-orange-100 sm:mt-2 sm:pt-2 sm:text-[10px]">
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
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    let animationFrame = 0;
    let pausedUntil = 0;

    const speed = 0.7;

    const pauseAutoScroll = () => {
      pausedUntil = Date.now() + 2500;
    };

    el.addEventListener("pointerdown", pauseAutoScroll);
    el.addEventListener("touchstart", pauseAutoScroll, { passive: true });
    el.addEventListener("wheel", pauseAutoScroll, { passive: true });

    const step = () => {
      if (Date.now() >= pausedUntil) {
        if (el.scrollWidth > el.clientWidth) {
          el.scrollLeft += speed;

          if (
            el.scrollLeft + el.clientWidth >=
            el.scrollWidth - 2
          ) {
            el.scrollLeft = 0;
          }
        }
      }

      animationFrame = requestAnimationFrame(step);
    };

    animationFrame = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrame);
      el.removeEventListener("pointerdown", pauseAutoScroll);
      el.removeEventListener("touchstart", pauseAutoScroll);
      el.removeEventListener("wheel", pauseAutoScroll);
    };
  }, [carouselRef]);

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

  const [likes, setLikes] = useState(
    Math.max(200, Number(product.likes || 200))
  );
  const [orders, setOrders] = useState(
    Math.max(300, Number(product.orders_count || 300))
  );
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadLikeState = async () => {
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
          setLiked(Boolean(data.liked));
        }
      } catch (error) {
        console.error("Failed to load product like state:", error);
      }
    };

    loadLikeState();

    return () => {
      cancelled = true;
    };
  }, [product.id]);

  const toggleLike = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    if (likeLoading) return;

    setLikeLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        alert(
          language === "sw"
            ? "Tafadhali ingia kwenye akaunti ili kuweka Like kwenye bidhaa hii."
            : "Please login to like this product."
        );
        return;
      }

      const response = await fetch(
        `/api/products/${product.id}/like`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data?.error ||
            (language === "sw"
              ? "Imeshindikana kusasisha Like."
              : "Unable to update like.")
        );
        return;
      }

      setLiked(Boolean(data.liked));
    } catch (error) {
      console.error("Failed to toggle product like:", error);

      alert(
        language === "sw"
          ? "Imeshindikana kuweka Like. Tafadhali jaribu tena."
          : "Unable to update like. Please try again."
      );
    } finally {
      setLikeLoading(false);
    }
  };

  return (
    <article className="group relative min-w-[180px] shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:min-w-[205px] lg:min-w-0">
      <div className="absolute right-2 top-2 z-20 flex flex-col items-center gap-2">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563eb] text-sm text-white shadow-md transition hover:bg-[#1d4ed8]"
          onClick={(e) => {
            e.stopPropagation();
            addToCart(product);
          }}
          aria-label="Add to cart"
        >
          🛒
        </button>

        <button
          type="button"
          className={`flex h-9 w-9 items-center justify-center rounded-full text-sm text-white shadow-md transition ${
            liked
              ? "bg-[#E30613] hover:bg-[#c80511]"
              : "bg-[#ef4444] hover:bg-[#dc2626]"
          }`}
          onClick={toggleLike}
          disabled={likeLoading}
          aria-label={liked ? "Unlike product" : "Like product"}
        >
          {liked ? "❤️" : "♡"}
        </button>
      </div>

      {discount > 0 && (
        <span className="absolute left-2 top-2 z-20 rounded-md bg-[#ef4444] px-2 py-1 text-[9px] font-bold text-white">
          -{discount}%
        </span>
      )}

      {bestSeller && (
        <span className="absolute left-2 top-9 z-20 rounded-md bg-[#1f2937] px-2 py-1 text-[9px] font-bold text-white">
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

              {typeof product.oldPrice === "number" &&
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

          <div className="mt-1 flex items-center gap-3 text-[9px] text-slate-500">
            <span>❤️ {likes} Likes</span>
            <span>🛒 {orders} Ordered</span>
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
    <div className="min-w-0">
      <h3 className="text-[10px] font-bold leading-4 whitespace-nowrap text-white sm:text-sm sm:font-black">
        {title}
      </h3>

      <div className="mt-1 space-y-1 sm:mt-4 sm:space-y-3">
        {links.map(([label, href]) => (
          <a
            key={`${label}-${href}`}
            href={href}
            className="block text-[9px] font-medium leading-3.5 text-slate-200 transition hover:text-white sm:text-xs sm:leading-normal"
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
  const styles: Record<string, string> = {
    Facebook:
      "bg-[#1877F2] text-white shadow-md shadow-blue-900/20 hover:bg-[#0d65d9]",
    Instagram:
      "bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white shadow-md shadow-pink-900/20 hover:brightness-110",
    TikTok:
      "bg-black text-white shadow-md shadow-black/30 hover:bg-slate-900",
  };

  return (
    <a
      href="#"
      aria-label={label}
      className={`flex h-10 w-10 items-center justify-center rounded-full text-base transition duration-200 hover:-translate-y-0.5 ${
        styles[label] || "bg-white text-slate-700"
      }`}
    >
      {icon}
    </a>
  );
}
