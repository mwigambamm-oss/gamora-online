"use client";

import { useRouter } from "next/navigation";

import { translations, type Language } from "@/lib/translations";
import { getProducts as getSupabaseProducts, type Product } from "@/lib/products";
import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";


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
  const [language, setLanguage] = useState<Language>("en");
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cartCount, setCartCount] = useState(0);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [notice, setNotice] = useState("");
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  const dealsRef = useRef<HTMLDivElement>(null);
  const newRef = useRef<HTMLDivElement>(null);
  const bestRef = useRef<HTMLDivElement>(null);

  const t = translations[language];

  useEffect(() => {
    const saved = localStorage.getItem("gamora_language");
    if (saved === "sw" || saved === "en") setLanguage(saved);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        const data = await getSupabaseProducts();
        if (active) setProducts(data);
      } catch (error) {
        console.error("Failed to load products:", error);
        if (active) setProducts([]);
      }
    }

    loadProducts();
    updateCartCount();

    const onStorage = () => updateCartCount();
    window.addEventListener("storage", onStorage);
    window.addEventListener("gamora-cart-updated", onStorage);

    return () => {
      active = false;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("gamora-cart-updated", onStorage);
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
        cart.reduce((total, item) => total + Number(item.quantity || 0), 0)
      );
    } catch {
      setCartCount(0);
    }
  }

  function changeLanguage(next: Language) {
    setLanguage(next);
    localStorage.setItem("gamora_language", next);
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

    const existingIndex = cart.findIndex((item) => item.id === product.id);

    if (existingIndex >= 0) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
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

  function scrollCarousel(ref: React.RefObject<HTMLDivElement | null>, direction: number) {
    ref.current?.scrollBy({
      left: direction * Math.max(280, ref.current.clientWidth * 0.82),
      behavior: "smooth",
    });
  }

  const categories = useMemo(() => {
    const found = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    const extra = found.filter((name) => !ALL_CATEGORIES.includes(name));
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
        selectedCategory === "All" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  const deals = useMemo(() => {
    return [...filteredProducts]
      .filter((p) => getDiscount(p) > 0)
      .sort((a, b) => getDiscount(b) - getDiscount(a))
      .slice(0, 10);
  }, [filteredProducts]);

  const recommended = useMemo(() => filteredProducts.slice(0, 10), [filteredProducts]);

  const newArrivals = useMemo(
    () => [...filteredProducts].sort((a, b) => b.id - a.id).slice(0, 10),
    [filteredProducts]
  );

  const bestSellers = useMemo(
    () =>
      [...filteredProducts]
        .sort((a, b) => Number(b.orders_count || 0) - Number(a.orders_count || 0))
        .slice(0, 10),
    [filteredProducts]
  );

  const heroProducts = useMemo(
    () => products.filter((p) => getProductImage(p)).slice(0, 3),
    [products]
  );

  const heroSlides = [
    {
      eyebrow: language === "sw" ? "KARIBU GAMORA ONLINE" : "WELCOME TO GAMORA ONLINE",
      title: language === "sw" ? "Nunua smart. Chagua Gamora." : "Shop smart. Choose Gamora.",
      text:
        language === "sw"
          ? "Gundua bidhaa unazopenda kwa bei nzuri, kwa uzoefu rahisi na salama."
          : "Discover products you love at great prices with a simple, secure shopping experience.",
      button: language === "sw" ? "ANZA KUNUNUA" : "SHOP NOW",
      product: heroProducts[0],
    },
    {
      eyebrow: language === "sw" ? "BIDHAA MPYA" : "NEW ARRIVALS",
      title: language === "sw" ? "Vitu vipya vimefika." : "Fresh finds have arrived.",
      text:
        language === "sw"
          ? "Angalia bidhaa mpya na uongeze kitu kipya kwenye kikapu chako."
          : "Explore the latest products and find something new for your cart.",
      button: language === "sw" ? "ANGALIA BIDHAA MPYA" : "EXPLORE NEW ARRIVALS",
      product: heroProducts[1] || heroProducts[0],
    },
    {
      eyebrow: language === "sw" ? "OFa MAALUM" : "SPECIAL DEALS",
      title: language === "sw" ? "Bei nzuri. Ofa kali." : "Better prices. Bigger deals.",
      text:
        language === "sw"
          ? "Pata punguzo kwenye bidhaa zilizochaguliwa kabla hazijaisha."
          : "Save more on selected products while the deals last.",
      button: language === "sw" ? "ANGALIA OFA" : "VIEW DEALS",
      product: deals[0] || heroProducts[2] || heroProducts[0],
    },
  ];

  const hero = heroSlides[heroIndex] || heroSlides[0];

  function goToCategory(category: string) {
    setSelectedCategory(category);
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <main className="min-h-screen bg-[#f3f4f6] text-[#374151]">
      {notice && (
        <div className="fixed left-1/2 top-5 z-[100] -translate-x-1/2 rounded-full bg-[#374151] px-5 py-3 text-xs font-bold text-white shadow-2xl sm:text-sm">
          ✓ {notice}
        </div>
      )}

      {/* TOP WELCOME ANNOUNCEMENT */}
      <div className="overflow-hidden bg-[#171a1f] text-white">
        <div className="announcement-marquee flex min-h-[36px] w-max items-center py-2 text-[13px] font-medium text-white sm:min-h-[40px] sm:text-sm">
          <span className="px-8 text-white">
            {language === "sw"
              ? "Karibu Gamora Online • Gundua bidhaa unazozipenda kwa bei nzuri • Pata ofa nzuri • Nunua kwa urahisi na kwa usalama."
              : "Welcome to Gamora Online • Discover products you love at great prices • Get great deals • Shop easily and securely."}
          </span>
          <span className="px-8 text-white">
            {language === "sw"
              ? "Karibu Gamora Online • Gundua bidhaa mpya • Pata ofa nzuri • Nunua kwa urahisi na kwa usalama."
              : "Welcome to Gamora Online • Discover new products • Get great deals • Shop easily and securely."}
          </span>
        </div>
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-[#e5e5e5] bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-[1280px] px-4">
          <div className="flex min-h-[64px] items-center gap-2 sm:min-h-[72px] sm:gap-5">
            <a href="/" className="shrink-0 flex items-center gap-2" aria-label="Gamora Online home">
              <div className="flex flex-col">
                <img 
                  src="/gamora-logo.png" 
                  alt="Gamora Online" 
                  className="h-16 w-auto object-contain sm:h-20" 
                />
                <span className="text-[10px] font-semibold text-[#374151] sm:text-xs">
                  Nunua smart. Chagua Gamora.
                </span>
              </div>
            </a>

            <nav className="hidden items-center gap-6 text-sm font-bold lg:flex">
              <a href="/" className="border-b-2 border-black py-6">{t.home}</a>
              <button
                type="button"
                onClick={() => setShowCategoryMenu((v) => !v)}
                className="flex items-center gap-1 py-6 text-[#555] transition hover:text-[#374151]"
              >
                {t.categories} <span className="text-xs">⌄</span>
              </button>
              <a href="#new-arrivals" className="py-6 text-[#555] transition hover:text-[#374151]">{language === "sw" ? "Bidhaa Mpya" : "New Arrivals"}</a>
              <a href="#deals" className="py-6 text-[#555] transition hover:text-[#374151]">{language === "sw" ? "Ofa" : "Deals"}</a>
              <a href="#best-sellers" className="py-6 text-[#555] transition hover:text-[#374151]">{language === "sw" ? "Zinazouzwa Sana" : "Best Sellers"}</a>
            </nav>

            <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-3">
              <div className="relative hidden w-56 md:block xl:w-72">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.search}
                  className="w-full rounded-full border border-[#d8d8d8] bg-[#f7f7f7] py-2.5 pl-4 pr-11 text-sm outline-none transition focus:border-[#777] focus:bg-white"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-[#555]">⌕</span>
              </div>

              <div className="flex items-center rounded-lg border border-[#dedede] bg-white p-0.5 text-[9px] font-black sm:p-1 sm:text-[11px]">
                <button onClick={() => changeLanguage("en")} className={`rounded-md px-1.5 py-1 ${language === "en" ? "bg-[#374151] text-white" : "text-[#666]"} sm:px-2.5 sm:py-1.5`}>EN</button>
                <button onClick={() => changeLanguage("sw")} className={`rounded-md px-1.5 py-1 ${language === "sw" ? "bg-[#374151] text-white" : "text-[#666]"} sm:px-2.5 sm:py-1.5`}>SW</button>
              </div>

              <a href="/account" className="flex h-9 items-center rounded-lg px-1.5 text-xs font-bold text-[#333] transition hover:bg-[#f1f1f1] sm:h-10 sm:px-2 sm:text-sm">
                {language === "sw" ? "Akaunti" : "Account"}
              </a>

              <a href="/cart" className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg transition hover:bg-[#f1f1f1] sm:h-10 sm:w-10 sm:text-xl" aria-label={`${t.cart}: ${cartCount}`}>
                🛒
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e30613] px-1 text-[10px] font-black text-white">{cartCount}</span>
                )}
              </a>
            </div>
          </div>

          <div className="pb-2 md:hidden">
            <div className="relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.search}
                className="w-full rounded-full border border-[#d8d8d8] bg-[#f7f7f7] py-2.5 pl-4 pr-11 text-sm outline-none focus:border-[#777] focus:bg-white"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-[#555]">⌕</span>
            </div>

            <nav className="mt-2 flex gap-5 overflow-x-auto whitespace-nowrap pb-1 text-[11px] font-bold scrollbar-hide">
              <button
                type="button"
                onClick={() => setShowCategoryMenu((v) => !v)}
                className="shrink-0 font-bold text-[#333]"
              >
                {t.categories} ⌄
              </button>
              <a href="#new-arrivals" className="shrink-0 text-[#333]">{language === "sw" ? "Bidhaa Mpya" : "New Arrivals"}</a>
              <a href="#deals" className="shrink-0 text-[#333]">{language === "sw" ? "Ofa" : "Deals"}</a>
              <a href="#best-sellers" className="shrink-0 text-[#333]">{language === "sw" ? "Zinazouzwa Sana" : "Best Sellers"}</a>
            </nav>
          </div>
        </div>
      </header>

      {showCategoryMenu && (
        <div className="absolute left-0 right-0 z-40 border-b border-[#e5e5e5] bg-white shadow-xl">
          <div className="mx-auto max-w-[1280px] px-4 py-5 sm:py-7">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-black text-[#222] sm:text-lg">
                {language === "sw" ? "Makundi yote" : "All Categories"}
              </h3>
              <button
                type="button"
                onClick={() => setShowCategoryMenu(false)}
                className="rounded-full px-3 py-1 text-lg text-[#555] hover:bg-[#f3f4f6]"
                aria-label="Close categories"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {ALL_CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    goToCategory(category);
                    setShowCategoryMenu(false);
                  }}
                  className="flex min-h-[58px] items-center gap-2 rounded-xl border border-[#e5e5e5] bg-white px-3 py-2 text-left text-xs font-bold text-[#333] transition hover:border-[#374151] hover:bg-[#f8f9fa] sm:text-sm"
                >
                  {CATEGORY_IMAGES[category] ? (
                    <img
                      src={CATEGORY_IMAGES[category]}
                      alt={category}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="text-xl">
                      {CATEGORY_ICONS[category] || "🛍️"}
                    </span>
                  )}
                  <span>{category}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HERO */}
      <section
        className="relative overflow-hidden bg-[#e8e9eb]"
        onMouseEnter={() => setHeroPaused(true)}
        onMouseLeave={() => setHeroPaused(false)}
      >
        <div className="mx-auto max-w-[1280px] px-4 py-8 sm:py-12 lg:py-16">
          <div className="relative min-h-[390px] overflow-hidden rounded-[28px] bg-[#e8e9eb] sm:min-h-[440px] lg:min-h-[500px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_45%,#ffffff_0%,#e8e9eb_43%,#d9dbde_100%)]" />

            <div className="relative grid min-h-[390px] items-center gap-6 px-6 py-10 sm:min-h-[440px] sm:px-10 lg:min-h-[500px] lg:grid-cols-[1.05fr_.95fr] lg:px-16">
              <div className="relative z-10 max-w-xl">
                <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-[#666] sm:text-sm">{hero.eyebrow}</p>
                <h1 className="max-w-xl text-4xl font-black leading-[0.98] tracking-tight text-[#111] sm:text-5xl lg:text-7xl">{hero.title}</h1>
                <p className="mt-5 max-w-lg text-sm leading-6 text-[#555] sm:text-base sm:leading-7">{hero.text}</p>
                <a href={hero.product ? `/product/${hero.product.id}` : "#products"} className="mt-7 inline-flex rounded-xl bg-[#374151] px-6 py-3.5 text-sm font-black text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-[#374151]">{hero.button} <span className="ml-2">→</span></a>
              </div>

              <div className="relative flex min-h-[210px] items-center justify-center lg:min-h-[360px]">
                <div className="absolute h-56 w-56 rounded-full bg-white/70 blur-2xl sm:h-72 sm:w-72 lg:h-96 lg:w-96" />
                {hero.product && getProductImage(hero.product) ? (
                  <img src={getProductImage(hero.product)} alt={hero.product.name} className="relative z-10 max-h-[280px] max-w-[88%] object-contain drop-shadow-2xl transition duration-700 sm:max-h-[350px] lg:max-h-[430px]" />
                ) : (
                  <div className="relative z-10 text-8xl opacity-30">🛍️</div>
                )}
              </div>
            </div>

            <button aria-label="Previous slide" onClick={() => setHeroIndex((heroIndex - 1 + heroSlides.length) % heroSlides.length)} className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl shadow-lg transition hover:bg-white">‹</button>
            <button aria-label="Next slide" onClick={() => setHeroIndex((heroIndex + 1) % heroSlides.length)} className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl shadow-lg transition hover:bg-white">›</button>

            <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
              {heroSlides.map((_, index) => (
                <button key={index} onClick={() => setHeroIndex(index)} aria-label={`Go to slide ${index + 1}`} className={`h-2 rounded-full transition-all ${index === heroIndex ? "w-7 bg-[#374151]" : "w-2 bg-[#999]"}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section id="categories" className="bg-white py-10 sm:py-14">
        <div className="mx-auto max-w-[1280px] px-4">
          <SectionHeading title={language === "sw" ? "Nunua kwa Kundi" : "Shop by Category"} subtitle={language === "sw" ? "Chagua unachotafuta kwa haraka." : "Find what you need quickly."} />

          {categories.length > 0 ? (
            <div className="relative mt-7"><button type="button" aria-label="Previous categories" onClick={() => document.getElementById("category-scroll")?.scrollBy({ left: -260, behavior: "smooth" })} className="absolute left-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#ddd] bg-white text-xl shadow-md sm:hidden">‹</button><div id="category-scroll" className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide lg:grid lg:grid-cols-6 lg:overflow-visible">
              {categories.map((category) => (
                <button key={category} onClick={() => goToCategory(category)} className={`group min-w-[120px] rounded-2xl border bg-white p-3 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg lg:min-w-0 ${selectedCategory === category ? "border-[#374151] ring-2 ring-[#374151]/10" : "border-[#e5e5e5]"}`}>
                  <div className="relative h-32 overflow-hidden rounded-xl bg-[#f1f1f1] sm:h-36">
                    {CATEGORY_IMAGES[category] ? <img src={CATEGORY_IMAGES[category]} alt={category} className="h-24 w-full object-contain transition duration-500 group-hover:scale-105 sm:h-28" /> : <div className="flex h-full items-center justify-center text-5xl">{CATEGORY_ICONS[category] || "🛍️"}</div>}
                  </div>
                  <p className="mt-3 line-clamp-1 text-sm font-black text-[#222]">{category}</p>
                  <p className="mt-1 text-xs text-[#777]">{language === "sw" ? "Angalia bidhaa →" : "Explore products →"}</p>
                </button>
              ))}
            </div>
            <button type="button" aria-label="Next categories" onClick={() => document.getElementById("category-scroll")?.scrollBy({ left: 260, behavior: "smooth" })} className="absolute right-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#ddd] bg-white text-xl shadow-md sm:hidden">›</button>
          </div>
          ) : (
            <div className="mt-7 rounded-2xl border border-dashed border-[#ddd] p-10 text-center text-sm text-[#777]">{t.noProducts}</div>
          )}
        </div>
      </section>

      {/* DEALS */}
      <section id="deals" className="bg-[#f3f4f6] py-10 sm:py-14 text-white">
        <div className="mx-auto max-w-[1280px] px-4">
          <div className="flex items-end justify-between gap-4">
            <SectionHeading title={language === "sw" ? "Ofa za Leo" : "Today's Deals"} subtitle={language === "sw" ? "Punguzo kwenye bidhaa zilizochaguliwa." : "Save on selected products."} />
            <CarouselArrows onPrev={() => scrollCarousel(dealsRef, -1)} onNext={() => scrollCarousel(dealsRef, 1)} />
          </div>

          {deals.length > 0 ? (
            <Carousel carouselRef={dealsRef} paused={false}>
              {deals.map((product) => <ProductCard key={product.id} product={product} addToCart={addToCart} />)}
            </Carousel>
          ) : (
            <EmptySection text={language === "sw" ? "Hakuna ofa kwa sasa." : "No active deals right now."} />
          )}
        </div>
      </section>

      {/* RECOMMENDED */}
      <section id="products" className="bg-[#f3f4f6] pb-10 sm:pb-14">
        <div className="mx-auto max-w-[1280px] px-4">
          <div className="flex items-end justify-between gap-4">
            <SectionHeading title={language === "sw" ? "Mapendekezo Kwako" : "Recommended For You"} subtitle={selectedCategory !== "All" ? selectedCategory : language === "sw" ? "Bidhaa zilizochaguliwa kwa ajili yako." : "Popular picks from our store."} />
            {selectedCategory !== "All" && <button onClick={() => setSelectedCategory("All")} className="text-xs font-black text-[#555] hover:text-[#374151]">{language === "sw" ? "Ondoa filter" : "Clear filter"} ×</button>}
          </div>

          {recommended.length > 0 ? (
            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {recommended.map((product) => <ProductCard key={product.id} product={product} addToCart={addToCart} />)}
            </div>
          ) : <EmptySection text={t.noProducts} />}
        </div>
      </section>

      {/* PROMO */}
      <section className="bg-[#f3f4f6] pb-10 sm:pb-14">
        <div className="mx-auto max-w-[1280px] px-4">
          <div className="relative overflow-hidden rounded-[28px] bg-[#292929] px-6 py-12 text-white shadow-xl sm:px-10 lg:px-16">
            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
            <div className="relative z-10 max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#bbb]">GAMORA ONLINE</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">{language === "sw" ? "Ofa kubwa. Bei bora." : "Big deals. Better prices."}</h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-[#ccc] sm:text-base">{language === "sw" ? "Gundua bidhaa nyingi zaidi na pata thamani zaidi kila unapofanya manunuzi Gamora." : "Discover more products and get more value every time you shop with Gamora."}</p>
              <a href="#deals" className="mt-7 inline-flex rounded-xl bg-white px-6 py-3.5 text-sm font-black text-[#374151] transition hover:-translate-y-0.5 hover:bg-[#eee]">{language === "sw" ? "ANGALIA OFA" : "SHOP DEALS"} →</a>
            </div>
          </div>
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section id="new-arrivals" className="bg-white py-10 sm:py-14">
        <div className="mx-auto max-w-[1280px] px-4">
          <div className="flex items-end justify-between gap-4">
            <SectionHeading title={language === "sw" ? "Bidhaa Mpya" : "New Arrivals"} subtitle={language === "sw" ? "Bidhaa mpya zilizoongezwa hivi karibuni." : "Recently added products."} />
            <CarouselArrows onPrev={() => scrollCarousel(newRef, -1)} onNext={() => scrollCarousel(newRef, 1)} />
          </div>
          <Carousel carouselRef={newRef} paused={false}>{newArrivals.map((product) => <ProductCard key={product.id} product={product} addToCart={addToCart} />)}</Carousel>
        </div>
      </section>

      {/* BEST SELLERS */}
      <section id="best-sellers" className="bg-[#f3f4f6] py-10 sm:py-14 text-white">
        <div className="mx-auto max-w-[1280px] px-4">
          <div className="flex items-end justify-between gap-4">
            <SectionHeading title={language === "sw" ? "Zinazouzwa Sana" : "Best Sellers"} subtitle={language === "sw" ? "Bidhaa zinazopendwa zaidi na wateja." : "Customer favorites."} />
            <CarouselArrows onPrev={() => scrollCarousel(bestRef, -1)} onNext={() => scrollCarousel(bestRef, 1)} />
          </div>
          <Carousel carouselRef={bestRef} paused={false}>{bestSellers.map((product) => <ProductCard key={product.id} product={product} addToCart={addToCart} bestSeller />)}</Carousel>
        </div>
      </section>

      {/* WHY GAMORA */}
      <section className="bg-white py-10 sm:py-14">
        <div className="mx-auto max-w-[1280px] px-4">
          <SectionHeading title={language === "sw" ? "Kwa Nini Gamora?" : "Why Shop With Gamora"} subtitle={language === "sw" ? "Uzoefu rahisi, salama na unaoaminika." : "A simple, secure and reliable shopping experience."} centered />
          <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-2xl border border-[#e5e5e5] gap-px bg-[#e5e5e5] sm:mt-8 sm:grid-cols-2 sm:gap-0 lg:grid-cols-4">
            <Benefit icon="✓" title={language === "sw" ? "Bidhaa Bora" : "Quality Products"} text={language === "sw" ? "Bidhaa zilizochaguliwa kwa ubora na thamani." : "Products selected for quality and value."} />
            <Benefit icon="🔒" title={language === "sw" ? "Ununuzi Salama" : "Secure Shopping"} text={language === "sw" ? "Taarifa zako zinalindwa wakati wa ununuzi." : "Your information is protected while shopping."} />
            <Benefit icon="↻" title={language === "sw" ? "Rahisi Kununua" : "Easy Shopping"} text={language === "sw" ? "Tafuta, chagua, ongeza kikapuni na agiza." : "Search, choose, add to cart and order."} />
            <Benefit icon="💬" title={language === "sw" ? "Msaada kwa Wateja" : "Customer Support"} text={language === "sw" ? "Tuko tayari kukusaidia unapohitaji." : "We are ready to help when you need us."} />
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="bg-[#f3f4f6] py-10 sm:py-14 text-white">
        <div className="mx-auto max-w-[900px] px-4 text-center">
          <div className="rounded-[28px] bg-[#374151] px-5 py-10 text-white sm:px-10 sm:py-12">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#aaa]">{language === "sw" ? "TAARIFA ZA GAMORA" : "GAMORA UPDATES"}</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">{language === "sw" ? "Endelea kupata taarifa." : "Stay updated."}</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#bbb]">{t.newsletterText}</p>
            <form onSubmit={(e) => { e.preventDefault(); setNotice(language === "sw" ? "Asante! Umejiunga." : "Thanks! You are subscribed."); window.setTimeout(() => setNotice(""), 2200); }} className="mx-auto mt-6 flex max-w-xl flex-col gap-2 sm:flex-row">
              <input type="email" required placeholder={t.emailPlaceholder} className="min-w-0 flex-1 rounded-xl bg-white px-4 py-3.5 text-sm text-[#374151] outline-none" />
              <button type="submit" className="rounded-xl bg-white px-6 py-3.5 text-sm font-black text-[#374151] transition hover:bg-[#eee]">{t.subscribe}</button>
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER */}
<footer id="about" className="border-t border-slate-200 bg-white py-8 text-slate-700 sm:py-10">
  <div className="mx-auto max-w-[1280px] px-4">

    <div className="grid grid-cols-3 gap-3 sm:gap-8">

      <FooterColumn
        title={language === "sw" ? "Duka" : "Shop"}
        links={[
          ["Makundi", "#categories"],
          ["Bidhaa Mpya", "#new-arrivals"],
          ["Ofa", "#deals"],
          ["Zinazouzwa Sana", "#best-sellers"],
        ]}
      />

      <FooterColumn
        title={language === "sw" ? "Mteja" : "Customer"}
        links={[
          ["Tengeneza Account", "/profile"],
          ["Oda Zangu", "/orders"],
          ["Wishlist", "/wishlist"],
          ["Kikapu", "/cart"],
        ]}
      />

      <FooterColumn
        title={language === "sw" ? "Msaada" : "Support"}
        links={[
          ["Jinsi ya Kununua", "/help"],
          ["Sera ya Uwasilishaji", "/delivery"],
          ["Vigezo na Masharti", "/terms"],
          ["Wasiliana Nasi", "/contact"],
        ]}
      />

    </div>

    <div className="mt-6 flex justify-center gap-3">
      <SocialButton 
        label="Facebook" 
        href="https://web.facebook.com/gamoraonline/" 
        icon="Facebook"
      />
      <SocialButton 
        label="Instagram" 
        href="https://www.instagram.com/gamoraonline_store/" 
        icon="Instagram"
      />
      <SocialButton 
        label="TikTok" 
        href="https://www.tiktok.com/@officialgamoraonline" 
        icon="TikTok"
      />
    </div>

    <div className="mt-6 border-t border-slate-200 pt-4 text-center text-xs text-slate-500">
      © 2026 Gamora Online. {t.rights}
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
  if (typeof product.discount === "number" && product.discount > 0) return product.discount;
  if (typeof product.oldPrice === "number" && product.oldPrice > product.price) {
    return Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
  }
  return 0;
}

function SectionHeading({ title, subtitle, centered = false }: { title: string; subtitle?: string; centered?: boolean }) {
  return (
    <div className={centered ? "text-center" : ""}>
      <h2 className="text-2xl font-black tracking-tight text-[#374151] sm:text-3xl">{title}</h2>
      {subtitle && <p className="mt-1.5 text-sm text-[#777]">{subtitle}</p>}
    </div>
  );
}

function Carousel({ children, carouselRef, paused = false }: { children: ReactNode; carouselRef: RefObject<HTMLDivElement | null>; paused?: boolean }) {
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (paused || hovered || !carouselRef.current) return;

    const el = carouselRef.current;
    let frame: number;
    let last = performance.now();

    const move = (now: number) => {
      const delta = now - last;
      last = now;

      const max = el.scrollWidth - el.clientWidth;

      if (max > 0) {
        el.scrollLeft += delta * 0.045;

        if (el.scrollLeft >= max - 1) {
          el.scrollTo({ left: 0, behavior: "auto" });
        }
      }

      frame = requestAnimationFrame(move);
    };

    frame = requestAnimationFrame(move);

    return () => cancelAnimationFrame(frame);
  }, [paused, hovered, carouselRef]);

  return (
    <div
      ref={carouselRef}
      className="mt-7 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 scrollbar-hide"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
      onTouchEnd={() => window.setTimeout(() => setHovered(false), 2500)}
    >
      {children}
    </div>
  );
}

function CarouselArrows({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onPrev}
        aria-label="Previous products"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ddd] bg-white text-lg font-medium text-[#374151] shadow-sm transition hover:bg-[#f2f2f2] sm:h-10 sm:w-10 sm:text-xl"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={onNext}
        aria-label="Next products"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ddd] bg-white text-lg font-medium text-[#374151] shadow-sm transition hover:bg-[#f2f2f2] sm:h-10 sm:w-10 sm:text-xl"
      >
        ›
      </button>
    </div>
  );
}

function ProductCard({ product, addToCart, bestSeller = false }: { product: Product; addToCart: (product: Product) => void; bestSeller?: boolean }) {
  const image = getProductImage(product);
  const discount = getDiscount(product);
  const rating = Number(product.rating || 0);
  const orders = Number(product.orders_count || 0);

  return (
    <article className="group w-[220px] min-w-[220px] snap-start overflow-hidden rounded-2xl border border-[#e4e4e4] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#ccc] hover:shadow-xl sm:w-[235px] sm:min-w-[235px] lg:w-[245px] lg:min-w-[245px]">
      <a href={`/product/${product.id}`} className="relative block aspect-[7/5] overflow-hidden bg-white">
        {image ? <img src={image} alt={product.name} loading="lazy" className="h-full w-full object-contain transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-6xl text-[#bbb]">🛍️</div>}
        {discount > 0 && <span className="absolute left-2 top-2 rounded-lg bg-[#e30613] px-2 py-1 text-[10px] font-black text-white shadow-sm">-{discount}%</span>}
        {bestSeller && <span className="absolute right-2 top-2 rounded-lg bg-[#374151] px-2 py-1 text-[9px] font-black text-white">BEST SELLER</span>}
      </a>

      <div className="p-2 sm:p-3.5 pb-1.5 sm:pb-3">
        <a href={`/product/${product.id}`}>
          <h3 className="mt-0.5 line-clamp-2 min-h-[30px] text-xs font-normal leading-4 sm:mt-1.5 sm:min-h-[40px] sm:text-sm sm:leading-5 font-black leading-5 text-[#111] transition hover:text-[#333]">{product.name}</h3>
        </a>

        <div className="mt-0.5 flex items-center gap-0.5">
          <span className="text-xs tracking-[1px] text-[#111]">★★★★★</span>
          <span className="text-[9px] font-normal text-[#333]">{rating > 0 ? rating.toFixed(1) : "New"}</span>
          {orders > 0 && <span className="text-[9px] text-[#555]">({orders})</span>}
        </div>

        <div className="mt-0.5 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-normal text-[#374151]">TSh {Number(product.price).toLocaleString()}</p>
            {typeof product.oldPrice === "number" && product.oldPrice > product.price && <p className="text-[10px] font-normal text-[#666] line-through">TSh {product.oldPrice.toLocaleString()}</p>}
          </div>
        </div>

        {product.stock <= 0 ? (
          <span className="mt-3 block text-xs font-black uppercase text-[#e30613]">OUT OF STOCK</span>
        ) : (
          <button type="button" onClick={() => addToCart(product)} className="mt-1 flex h-8 w-full items-center justify-center rounded-lg bg-[#374151] px-3 text-xs font-normal text-white transition hover:bg-[#374151]">🛒 ADD TO CART</button>
        )}
      </div>
    </article>
  );
}

function Benefit({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="border-b border-[#e5e5e5] px-5 py-7 text-center sm:border-r lg:border-b-0 lg:last:border-r-0">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f0f0f0] text-lg font-black text-[#333]">{icon}</div>
      <h3 className="mt-4 text-[10px] leading-4 sm:text-sm font-black text-[#222]">{title}</h3>
      <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-[#777]">{text}</p>
    </div>
  );
}

function EmptySection({ text }: { text: string }) {
  return <div className="mt-7 rounded-2xl border border-dashed border-[#d7d7d7] bg-white py-16 text-center text-sm text-[#777]">{text}</div>;
}

function FooterColumn({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <div>
      <h3 className="text-[10px] sm:text-sm text-[11px] font-black sm:text-sm text-white">{title}</h3>
      <div className="mt-4 space-y-3 text-[10px] sm:text-sm text-[#999]">
        {links.map(([label, href]) => <a key={`${label}-${href}`} href={href} className="block transition hover:text-white">{label}</a>)}
      </div>
    </div>
  );
}

function SocialButton({ icon, label, href }: { icon: string; label: string; href: string }) {
  const icons: Record<string, React.ReactNode> = {
    Facebook: (
      <svg viewBox="0 0 24 24" className="h-4 w-4">
        <path fill="#1877F2" d="M14 8h3V4h-3c-3.31 0-5 2.08-5 5v3H6v4h3v8h4v-8h3l1-4h-4V9c0-.6.4-1 1-1z"/>
      </svg>
    ),
    Instagram: (
      <svg viewBox="0 0 24 24" className="h-4 w-4">
        <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5z"/>
      </svg>
    ),
    TikTok: (
      <svg viewBox="0 0 24 24" className="h-4 w-4">
        <path fill="#000000" d="M16 2h3c.2 2 1.3 3.6 3 4.5v3.2c-1.8-.1-3.5-.7-5-1.7v7.2a6 6 0 1 1-6-6v3.2a3 3 0 1 0 2 2.7V2z"/>
      </svg>
    ),
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm transition hover:scale-110"
    >
      {icons[icon]}
    </a>
  );
}
