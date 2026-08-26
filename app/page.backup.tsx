"use client";
"use client";

import { getProducts as getSupabaseProducts } from "@/lib/products";
import { useEffect, useMemo, useState } from "react";

type Language = "sw" | "en";

type Product = {
  id: number;
  name: string;
  price: number;
  oldPrice?: number;
  category: string;
  stock: number;
  description?: string;
  image?: string;
};

type CartItem = Product & {
  quantity: number;
};

const translations = {
  sw: {
    home: "Nyumbani",
    categories: "Makundi",
    flashSale: "Ofa Maalum",
    popular: "Bidhaa Maarufu",
    search: "Tafuta bidhaa...",
    shopNow: "Nunua Sasa",
    addToCart: "Weka kwenye Cart",
    viewAll: "Angalia Zote",
    cart: "Cart",
    products: "Bidhaa",
    all: "Zote",
    shoppingGuide: "Mwongozo wa Ununuzi",
    subscription: "Subscription",
    helpCenter: "Kituo cha Msaada",
    about: "Kuhusu GAMORA ONLINE",
    contact: "Wasiliana Nasi",
    address: "Anwani",
    phone: "Simu",
    stayConnected: "Endelea Kuunganishwa",
    newsletter: "Pokea ofa na taarifa mpya",
    emailPlaceholder: "Weka email yako",
    subscribe: "Jiunge",
    rights: "Haki zote zimehifadhiwa.",
    heroTitle: "Nunua Kila Unachohitaji",
    heroText:
      "Karibu GAMORA ONLINE — marketplace yako ya kisasa kwa bidhaa bora kwa bei nzuri.",
    delivery: "Delivery ya Haraka",
    secure: "Ununuzi Salama",
    quality: "Bidhaa Bora",
    support: "Huduma kwa Wateja",
    noProducts: "Hakuna bidhaa zilizopatikana.",
    added: "imeongezwa kwenye cart.",
  },

  en: {
    home: "Home",
    categories: "Categories",
    flashSale: "Special Offers",
    popular: "Popular Products",
    search: "Search products...",
    shopNow: "Shop Now",
    addToCart: "Add to Cart",
    viewAll: "View All",
    cart: "Cart",
    products: "Products",
    all: "All",
    shoppingGuide: "Shopping Guide",
    subscription: "Subscription",
    helpCenter: "Help Center",
    about: "About GAMORA ONLINE",
    contact: "Contact Us",
    address: "Address",
    phone: "Phone",
    stayConnected: "Stay Connected",
    newsletter: "Get latest offers and updates",
    emailPlaceholder: "Enter your email",
    subscribe: "Subscribe",
    rights: "All rights reserved.",
    heroTitle: "Shop Everything You Need",
    heroText:
      "Welcome to GAMORA ONLINE — your modern marketplace for quality products at great prices.",
    delivery: "Fast Delivery",
    secure: "Secure Shopping",
    quality: "Quality Products",
    support: "Customer Support",
    noProducts: "No products found.",
    added: "has been added to your cart.",
  },
};

export default function HomePage() {
  const [language, setLanguage] = useState<Language>("sw");
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("All");
  const [cartCount, setCartCount] = useState(0);

  const t = translations[language];

  useEffect(() => {
    loadProducts();
    updateCartCount();

    window.addEventListener(
      "storage",
      updateCartCount
    );

    return () => {
      window.removeEventListener(
        "storage",
        updateCartCount
      );
    };
  }, []);

  async function loadProducts() {
    try {
      const data = await getSupabaseProducts();

      setProducts(data);
    } catch (error) {
      console.error("Failed to load products:", error);
      setProducts([]);
    }
  }

  function updateCartCount() {
    const savedCart =
      localStorage.getItem("gamora_cart");

    if (!savedCart) {
      setCartCount(0);
      return;
    }

    try {
      const cart: CartItem[] = JSON.parse(savedCart);

      const count = cart.reduce(
        (total, item) => total + item.quantity,
        0
      );

      setCartCount(count);
    } catch {
      setCartCount(0);
    }
  }

  function addToCart(product: Product) {
    const savedCart = localStorage.getItem("gamora_cart");

    let cart: CartItem[] = [];

    if (savedCart) {
      try {
        cart = JSON.parse(savedCart);
      } catch {
        cart = [];
      }
    }

    const existing = cart.find(
      (item) => item.id === product.id
    );

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        ...product,
        quantity: 1,
      });
    }

    localStorage.setItem(
      "gamora_cart",
      JSON.stringify(cart)
    );

    console.log("GAMORA CART ITEM:", cart);

    updateCartCount();

    alert(`${product.name} ${t.added}`);
  }

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(products.map((product) => product.category))
    );

    return ["All", ...unique];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        product.category
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" ||
        product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  const saleProducts = products
    .filter(
      (product) =>
        product.oldPrice &&
        product.oldPrice > product.price
    )
    .slice(0, 4);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* TOP BAR */}

      <div className="bg-[#071B3A] px-4 py-2 text-center text-sm text-white">
        🚚 {t.delivery} • 🔒 {t.secure} • ⭐{" "}
        {t.quality}
      </div>

      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b bg-white/95 shadow-sm backdrop-blur">

        <div className="mx-auto max-w-7xl px-4">

          <div className="flex min-h-20 items-center gap-4">

            {/* LOGO */}

<a
  href="/"
  className="flex shrink-0 items-center"
>
  <img
    src="/gamora-logo.png"
    alt="Gamora Online"
    className="h-16 w-auto object-contain"
  />
</a>
            {/* SEARCH */}

            <div className="hidden flex-1 md:block">

              <div className="relative mx-auto max-w-2xl">

                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                  🔎
                </span>

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.search}
                  className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-11 pr-5 outline-none transition focus:border-[#F28C28] focus:bg-white"
                />

              </div>

            </div>

            {/* LANGUAGE */}

            <div className="flex rounded-lg border bg-white p-1">

              <button
                onClick={() => setLanguage("sw")}
                className={`rounded-md px-2 py-2 text-xs font-bold ${
                  language === "sw"
                    ? "bg-[#F28C28] text-white"
                    : "text-slate-600"
                }`}
              >
                🇹🇿 SW
              </button>

              <button
                onClick={() => setLanguage("en")}
                className={`rounded-md px-2 py-2 text-xs font-bold ${
                  language === "en"
                    ? "bg-[#F28C28] text-white"
                    : "text-slate-600"
                }`}
              >
                🇬🇧 EN
              </button>

            </div>

            {/* CART */}

            <a
              href="/cart"
              className="relative flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 font-bold text-slate-800 transition hover:border-[#F6B15C] hover:bg-[#FFF3E6]"
            >
              🛒
              <span className="hidden sm:inline">
                {t.cart}
              </span>

              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-black text-white">
                  {cartCount}
                </span>
              )}
            </a>

          </div>

          {/* MOBILE SEARCH */}

          <div className="pb-4 md:hidden">

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.search}
              className="w-full rounded-full border border-slate-200 bg-slate-50 px-5 py-3 outline-none focus:border-[#F28C28]"
            />

          </div>

          {/* NAVIGATION */}

          <nav className="hidden items-center gap-8 border-t py-3 text-sm font-bold text-slate-700 md:flex">

            <a
              href="/"
              className="text-[#0E3A70] transition hover:text-[#F28C28]"
            >
              {t.home}
            </a>

            <a
              href="#categories"
              className="transition hover:text-[#0E3A70]"
            >
              {t.categories}
            </a>

            <a
              href="#offers"
              className="transition hover:text-[#0E3A70]"
            >
              {t.flashSale}
            </a>

            <a
              href="#products"
              className="transition hover:text-[#0E3A70]"
            >
              {t.popular}
            </a>

            <a
              href="#shopping-guide"
              className="transition hover:text-[#0E3A70]"
            >
              {t.shoppingGuide}
            </a>

            <a
              href="/contact"
              className="transition hover:text-[#0E3A70]"
            >
              {t.contact}
            </a>

          </nav>

        </div>

      </header>

      {/* HERO */}

      <section className="bg-slate-100 px-4 py-5 sm:py-8">
        <div className="mx-auto max-w-7xl">

          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#071B3A] via-[#0E3A70] to-[#F28C28] shadow-2xl">

            {/* Decorative shapes */}
            <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />
            <div className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

            <div className="relative grid min-h-[440px] items-center md:grid-cols-2">

              {/* HERO TEXT */}

              <div className="px-7 py-12 sm:px-10 lg:px-14">

                <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-white backdrop-blur">
                  GAMORA ONLINE
                </div>

                <h1 className="mt-5 max-w-xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
                  {language === "sw"
                    ? "Nunua kwa Urahisi. Chagua kwa Kujiamini."
                    : "Shop Easily. Choose with Confidence."}
                </h1>

                <p className="mt-5 max-w-lg text-base leading-7 text-[#EAF2FA] sm:text-lg">
                  {language === "sw"
                    ? "Fashion, viatu, simu, electronics na bidhaa za nyumbani — zote sehemu moja kwa bei nzuri."
                    : "Fashion, shoes, phones, electronics and home products — all in one place at great prices."}
                </p>

                <div className="mt-8 flex flex-wrap gap-3">

                  <a
                    href="#products"
                    className="rounded-xl bg-white px-7 py-4 font-black text-[#071B3A] shadow-xl transition hover:-translate-y-1 hover:bg-[#FFF3E6]"
                  >
                    {t.shopNow} →
                  </a>

                  <a
                    href="#categories"
                    className="rounded-xl border border-white/30 bg-white/10 px-7 py-4 font-black text-white backdrop-blur transition hover:bg-white/20"
                  >
                    {t.categories}
                  </a>

                </div>

                <div className="mt-8 flex flex-wrap gap-5 text-sm font-bold text-[#EAF2FA]">
                  <span>✓ {t.quality}</span>
                  <span>✓ {t.delivery}</span>
                  <span>✓ {t.secure}</span>
                </div>

              </div>

              {/* PRODUCT VISUALS — NO PEOPLE */}

              <div className="relative hidden min-h-[440px] items-center justify-center md:flex">

                <div className="absolute right-8 top-8 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

                <div className="relative grid w-full max-w-lg grid-cols-2 gap-4 p-8">

                  <div className="group overflow-hidden rounded-2xl bg-white shadow-2xl">
                    <img
                      src="/images/womens-fashion.jpg"
                      alt="Women's Fashion"
                      className="h-44 w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="p-3">
                      <p className="font-black text-slate-900">
                        Women's Fashion
                      </p>
                    </div>
                  </div>

                  <div className="group mt-8 overflow-hidden rounded-2xl bg-white shadow-2xl">
                    <img
                      src="/images/phone.jpg"
                      alt="Phones and Electronics"
                      className="h-44 w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="p-3">
                      <p className="font-black text-slate-900">
                        Phones & Electronics
                      </p>
                    </div>
                  </div>

                  <div className="group -mt-4 overflow-hidden rounded-2xl bg-white shadow-2xl">
                    <img
                      src="/images/shoes.jpg"
                      alt="Shoes"
                      className="h-44 w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="p-3">
                      <p className="font-black text-slate-900">
                        Shoes
                      </p>
                    </div>
                  </div>

                  <div className="group overflow-hidden rounded-2xl bg-white shadow-2xl">
                    <img
                      src="/images/home-kitchen.jpg"
                      alt="Home and Kitchen"
                      className="h-44 w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="p-3">
                      <p className="font-black text-slate-900">
                        Home & Kitchen
                      </p>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* FEATURES */}

      <section className="border-b bg-white">

        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x md:grid-cols-4">

          <div className="p-6 text-center">
            <div className="text-3xl">🚚</div>
            <p className="mt-2 font-black">
              {t.delivery}
            </p>
          </div>

          <div className="p-6 text-center">
            <div className="text-3xl">🔒</div>
            <p className="mt-2 font-black">
              {t.secure}
            </p>
          </div>

          <div className="p-6 text-center">
            <div className="text-3xl">⭐</div>
            <p className="mt-2 font-black">
              {t.quality}
            </p>
          </div>

          <div className="p-6 text-center">
            <div className="text-3xl">💬</div>
            <p className="mt-2 font-black">
              {t.support}
            </p>
          </div>

        </div>

      </section>

      {/* CATEGORIES */}

      <section
        id="categories"
        className="bg-white py-14"
      >

        <div className="mx-auto max-w-7xl px-4">

          <div className="mb-8 flex items-end justify-between">

            <div>
              <p className="text-sm font-black uppercase tracking-widest text-[#0E3A70]">
                GAMORA ONLINE
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                {language === "sw"
                  ? "Nunua kwa Makundi"
                  : "Shop by Category"}
              </h2>

              <p className="mt-2 max-w-2xl text-slate-500">
                {language === "sw"
                  ? "Chagua kundi unalopenda na ugundue bidhaa zinazopatikana."
                  : "Choose a category and discover products available in our store."}
              </p>
            </div>

            <button
              onClick={() => setSelectedCategory("All")}
              className="hidden rounded-xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 transition hover:border-[#F6B15C] hover:bg-[#FFF3E6] md:block"
            >
              {t.viewAll} →
            </button>

          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">

            {/* WOMEN */}

            <button
              onClick={() => setSelectedCategory("Women's Fashion")}
              className="group relative overflow-hidden rounded-3xl bg-slate-900 text-left shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src="/images/womens-fashion.jpg"
                  alt="Women's Fashion"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <h3 className="text-xl font-black">
                  Women's Fashion
                </h3>

                <span className="mt-2 inline-block text-sm font-bold text-white/90">
                  Shop Now →
                </span>
              </div>
            </button>

            {/* MEN */}

            <button
              onClick={() => setSelectedCategory("Men's Fashion")}
              className="group relative overflow-hidden rounded-3xl bg-slate-900 text-left shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src="/images/mens-fashion.jpg"
                  alt="Men's Fashion"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <h3 className="text-xl font-black">
                  Men's Fashion
                </h3>

                <span className="mt-2 inline-block text-sm font-bold text-white/90">
                  Shop Now →
                </span>
              </div>
            </button>

            {/* SHOES */}

            <button
              onClick={() => setSelectedCategory("Shoes")}
              className="group relative overflow-hidden rounded-3xl bg-slate-900 text-left shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src="/images/shoes.jpg"
                  alt="Shoes"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <h3 className="text-xl font-black">
                  Shoes
                </h3>

                <span className="mt-2 inline-block text-sm font-bold text-white/90">
                  Shop Now →
                </span>
              </div>
            </button>

            {/* HOME */}

            <button
              onClick={() => setSelectedCategory("Home & Kitchen")}
              className="group relative overflow-hidden rounded-3xl bg-slate-900 text-left shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src="/images/home-kitchen.jpg"
                  alt="Home and Kitchen"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <h3 className="text-xl font-black">
                  Home & Kitchen
                </h3>

                <span className="mt-2 inline-block text-sm font-bold text-white/90">
                  Shop Now →
                </span>
              </div>
            </button>

            {/* PHONES */}

            <button
              onClick={() => setSelectedCategory("Phones & Electronics")}
              className="group relative overflow-hidden rounded-3xl bg-slate-900 text-left shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src="/images/phone.jpg"
                  alt="Phones and Electronics"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <h3 className="text-xl font-black">
                  Phones & Electronics
                </h3>

                <span className="mt-2 inline-block text-sm font-bold text-white/90">
                  Shop Now →
                </span>
              </div>
            </button>

          </div>

        </div>

      </section>

      {/* FEATURES */}

      <section className="border-b bg-white">

        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x md:grid-cols-4">

          <div className="p-6 text-center">
            <div className="text-3xl">🚚</div>
            <p className="mt-2 font-black">
              {t.delivery}
            </p>
          </div>

          <div className="p-6 text-center">
            <div className="text-3xl">🔒</div>
            <p className="mt-2 font-black">
              {t.secure}
            </p>
          </div>

          <div className="p-6 text-center">
            <div className="text-3xl">⭐</div>
            <p className="mt-2 font-black">
              {t.quality}
            </p>
          </div>

          <div className="p-6 text-center">
            <div className="text-3xl">💬</div>
            <p className="mt-2 font-black">
              {t.support}
            </p>
          </div>

        </div>

      </section>

      {/* FLASH SALE */}

      {saleProducts.length > 0 && (

        <section
          id="offers"
          className="bg-[#FFF8F0] py-12"
        >

          <div className="mx-auto max-w-7xl px-4">

            <div className="mb-7 flex items-end justify-between">

              <div>

                <p className="font-bold text-red-500">
                  🔥 LIMITED TIME
                </p>

                <h2 className="text-3xl font-black">
                  {t.flashSale}
                </h2>

              </div>

              <button
                onClick={() => {
                  setSelectedCategory("All");
                  setTimeout(() => {
                    document
                      .getElementById("products")
                      ?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                  }, 50);
                }}
                className="rounded-lg px-2 py-2 font-bold text-[#0E3A70] transition hover:bg-[#FFF3E6] active:scale-95"
              >
                {t.viewAll} →
              </button>

            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

              {saleProducts.map((product) => (

                <ProductCard
                  key={product.id}
                  product={product}
                  language={language}
                  addToCart={addToCart}
                  t={t}
                />

              ))}

            </div>

          </div>

        </section>

      )}

      {/* PRODUCTS */}

      <section
        id="products"
        className="mx-auto max-w-7xl px-4 py-14"
      >

        <div className="mb-7">

          <p className="font-bold text-[#0E3A70]">
            GAMORA MARKETPLACE
          </p>

          <h2 className="text-3xl font-black">
            {selectedCategory === "All"
              ? t.popular
              : selectedCategory}
          </h2>

          {selectedCategory !== "All" && (
            <button
              onClick={() => setSelectedCategory("All")}
              className="mt-3 rounded-lg bg-[#FFF8F0] px-4 py-2 text-sm font-bold text-[#0E3A70] transition hover:bg-[#FFE5CC]"
            >
              ← All Products
            </button>
          )}

        </div>

        {filteredProducts.length === 0 ? (

          <div className="rounded-2xl bg-white py-20 text-center shadow-sm">

            <div className="text-6xl">
              🔎
            </div>

            <p className="mt-4 font-bold text-slate-500">
              {t.noProducts}
            </p>

          </div>

        ) : (

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">

            {filteredProducts.map((product) => (

              <ProductCard
                key={product.id}
                product={product}
                language={language}
                addToCart={addToCart}
                t={t}
              />

            ))}

          </div>

        )}

      </section>

      {/* NEWSLETTER */}

      <section className="bg-[#0E3A70] py-14">

        <div className="mx-auto max-w-4xl px-4 text-center text-white">

          <div className="text-5xl">
            📬
          </div>

          <h2 className="mt-4 text-3xl font-black">
            {t.subscription}
          </h2>

          <p className="mt-3 text-[#EAF2FA]">
            {t.newsletter}
          </p>

          <div className="mx-auto mt-7 flex max-w-xl flex-col gap-3 sm:flex-row">

            <input
              type="email"
              placeholder={t.emailPlaceholder}
              className="flex-1 rounded-lg px-5 py-4 text-slate-900 outline-none"
            />

            <button
              className="rounded-lg bg-white px-7 py-4 font-black text-[#0E3A70] hover:bg-[#FFF3E6]"
              onClick={() =>
                alert(
                  language === "sw"
                    ? "Asante! Umejiunga na GAMORA ONLINE."
                    : "Thank you! You have subscribed to GAMORA ONLINE."
                )
              }
            >
              {t.subscribe}
            </button>

          </div>

        </div>

      </section>

      {/* FOOTER */}

      <footer className="bg-[#071B3A] text-white">

        <div className="mx-auto max-w-7xl px-4 py-14">

          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">

            {/* ABOUT */}

            <div>

              <div className="text-2xl font-black text-white">
                GAMORA
                <span className="text-[#F6B15C]">
                  ONLINE
                </span>
              </div>

              <p className="mt-5 leading-7 text-[#D8E5F5]">
                {language === "sw"
                  ? "Marketplace ya kisasa inayokusaidia kupata bidhaa bora kwa urahisi, usalama na huduma nzuri."
                  : "A modern marketplace helping you discover quality products with convenience, security and great service."}
              </p>

            </div>

            {/* SHOPPING */}

            <div>

              <h3 className="font-black">
                {t.shoppingGuide}
              </h3>

              <ul className="mt-5 space-y-3 text-[#D8E5F5]">

                <li>
                  
                   <a href="#products">
                    {t.products}
                  </a>
                </li>

                <li>
                  <a href="#categories">
                    {t.categories}
                  </a>
                </li>

                <li>
                  <a href="#offers">
                    {t.flashSale}
                  </a>
                </li>

                <li>
                  <a href="/cart">
                    {t.cart}
                  </a>
                </li>

              </ul>

            </div>

            {/* HELP */}

            <div>

              <h3 className="font-black">
                {t.helpCenter}
              </h3>

              <ul className="mt-5 space-y-3 text-[#D8E5F5]">
<li>
  <a
    href="/help"
    className="transition hover:text-white"
  >
    {t.helpCenter}
  </a>
</li>
<li>
  <a
    href="/about"
    className="transition hover:text-white"
  >
    {t.about}
  </a>
</li>
<li>
  <a
    href="/contact"
    className="transition hover:text-white"
  >
    {t.contact}
  </a>
</li>
<li>
  <a
    href="/delivery"
    className="transition hover:text-white"
  >
    {language === "sw"
      ? "Taarifa za Delivery"
      : "Delivery Information"}
  </a>
</li>
<li>
  <a
    href="/terms"
    className="transition hover:text-white"
  >
    {language === "sw"
      ? "Masharti na Vigezo"
      : "Terms & Conditions"}
  </a>
</li>
<li>
  <a
    href="/privacy"
    className="transition hover:text-white"
  >
    {language === "sw"
      ? "Sera ya Faragha"
      : "Privacy Policy"}
  </a>
</li>
              </ul>

            </div>

            {/* CONTACT */}

            <div>

              <h3 className="font-black">
                {t.contact}
              </h3>

              <div className="mt-5 space-y-4 text-[#D8E5F5]">

                <p>
                  📍 <strong>{t.address}:</strong>
                  <br />
                  Kariakoo, Dar es Salaam, Tanzania
                </p>

                <p>
                  ☎️ <strong>{t.phone}:</strong>
                  <br />
                  +255 798 555 221
                </p>

                <p>
                  💬 WhatsApp:
                  <br />
                  +255 798 555 221
                </p>

              </div>

            </div>

          </div>

          {/* SOCIAL */}

          <div className="mt-12 border-t border-[#164A7A] pt-8">

            <h3 className="font-black">
              {t.stayConnected}
            </h3>

            <div className="mt-5 flex flex-wrap gap-3">

<SocialButton
  icon="f"
  label="Facebook"
  href="https://web.facebook.com/gamoraonline/"
/>
<SocialButton
  icon="◎"
  label="Instagram"
  href="https://www.instagram.com/gamoraonline_store/"
/>
<SocialButton
  icon="♪"
  label="TikTok"
  href="https://www.tiktok.com/@officialgamoraonline"
/>
              <a
                href="https://wa.me/255798555221"
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-green-600 px-5 py-3 font-bold transition hover:bg-green-700"
              >
                WhatsApp
              </a>

            </div>

          </div>

          {/* COPYRIGHT */}

          <div className="mt-10 border-t border-[#164A7A] pt-6 text-center text-sm text-[#F6B15C]">

            © {new Date().getFullYear()} GAMORA ONLINE.{" "}
            {t.rights}

          </div>

        </div>

      </footer>

    </main>
  );
}

function ProductCard({
  product,
  addToCart,
  t,
}: {
  product: Product;
  language: Language;
  addToCart: (product: Product) => void;
  t: (typeof translations)["sw"];
}) {
  const discount =
    product.oldPrice &&
    product.oldPrice > product.price
      ? Math.round(
          ((product.oldPrice - product.price) /
            product.oldPrice) *
            100
        )
      : 0;

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

      {/* PRODUCT IMAGE */}

      <a
        href={`/product/${product.id}`}
        className="relative block h-56 overflow-hidden bg-slate-50"
        aria-label={`View ${product.name}`}
      >

        <div className="flex h-full items-center justify-center">

          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="text-7xl opacity-70 transition duration-500 group-hover:scale-110">
              🛍️
            </div>
          )}

        </div>

        {/* DISCOUNT */}

        {discount > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-red-500 px-3 py-1.5 text-xs font-black text-white shadow-md">
            -{discount}%
          </span>
        )}

        {/* STOCK */}

        {isLowStock && (
          <span className="absolute right-3 top-3 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-red-500 shadow-md">
            Only {product.stock} left
          </span>
        )}

        {isOutOfStock && (
          <span className="absolute inset-0 flex items-center justify-center bg-slate-900/45">
            <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-900 shadow-lg">
              Out of Stock
            </span>
          </span>
        )}

      </a>

      {/* PRODUCT DETAILS */}

      <div className="p-4">

        <p className="text-[11px] font-black uppercase tracking-wide text-[#0E3A70]">
          {product.category}
        </p>

        <a
          href={`/product/${product.id}`}
          className="mt-2 block min-h-12 line-clamp-2 text-base font-black leading-6 text-slate-900 transition hover:text-[#0E3A70]"
        >
          {product.name}
        </a>

        {/* RATING */}

        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm tracking-wide">
            ⭐⭐⭐⭐⭐
          </span>

          <span className="text-xs font-medium text-slate-400">
            (New)
          </span>
        </div>

        {/* PRICE */}

        <div className="mt-3 flex flex-wrap items-baseline gap-2">

          <span className="text-xl font-black text-[#0E3A70]">
            TZS {product.price.toLocaleString()}
          </span>

          {product.oldPrice &&
            product.oldPrice > product.price && (
              <span className="text-sm font-medium text-slate-400 line-through">
                TZS {product.oldPrice.toLocaleString()}
              </span>
            )}

        </div>

        {/* ACTION */}

        <button
          onClick={() => addToCart(product)}
          disabled={isOutOfStock}
          className="mt-4 w-full rounded-xl bg-[#F28C28] px-4 py-3 text-sm font-black text-white shadow-sm transition-all duration-200 hover:bg-[#0E3A70] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
        >
          {isOutOfStock ? "Out of Stock" : `🛒 ${t.addToCart}`}
        </button>

      </div>

    </article>
  );
}

function GuideCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-7 text-center transition hover:-translate-y-1 hover:shadow-lg">

      <div className="text-5xl">
        {icon}
      </div>

      <h3 className="mt-5 text-xl font-black">
        {title}
      </h3>

      <p className="mt-3 leading-7 text-slate-500">
        {text}
      </p>

    </div>
  );
}
function SocialButton({
  icon,
  label,
  href,
}: {
  icon: string;
  label: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-lg bg-[#0B2A55] px-5 py-3 font-bold transition hover:-translate-y-1 hover:bg-orange-500"
    >
      <span className="text-lg">{icon}</span>
      {label}
    </a>
  );
}
