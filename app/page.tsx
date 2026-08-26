"use client";

import { getProducts as getSupabaseProducts } from "@/lib/products";
import { useEffect, useMemo, useState } from "react";

type Language = "sw" | "en";

type Product = {
  id: number;
  name: string;
  price: number;
  oldPrice: number;
  category: string;
  stock: number;
  description?: string;
  image?: string;
};

type CartItem = Product & { quantity: number };

const translations = {
  sw: {
    home: "Nyumbani",
    shop: "Duka",
    categories: "Makundi",
    about: "Kuhusu Sisi",
    contact: "Wasiliana Nasi",
    search: "Tafuta bidhaa...",
    featured: "Bidhaa Maarufu",
    marquee: "🇹🇿 KARIBU GAMORA ONLINE • NUNUA KWA URAHISI • CHAGUA KWA KUJIAMINI •",
    safeOrder: "Oda yako inafika salama.",
    safeInfo: "Taarifa zako ziko salama.",
    realProducts: "Bidhaa bora na halisi.",
    aboutText: "GAMORA ONLINE ni duka lako la kuaminika kwa bidhaa bora kwa bei nzuri.",

    viewAll: "Angalia Zote",
    cart: "Cart",
    freeDelivery: "DELIVERY YA UHAKIKA • UNUNUZI SALAMA",
    deliveryTitle: "DELIVERY YA UHAKIKA",
    deliveryText: "100% tunahakikisha oda yako inafika salama",
    secureTitle: "USALAMA",
    secureText: "Usalama wa taarifa zako ni 100%",
    qualityTitle: "BIDHAA BORA",
    qualityText: "Bidhaa bora zenye uhakika na uhalisia",
    supportTitle: "HUDUMA KWA WATEJA",
    supportText: "24/7 tuko tayari kukuhudumia",
    quickLinks: "QUICK LINKS",
    customerService: "CUSTOMER SERVICE",
    newsletter: "NEWSLETTER",
    newsletterText: "Jiandikishe kupata taarifa za bidhaa mpya na ofa maalum.",
    emailPlaceholder: "Weka email yako",
    subscribe: "Jiunge",
    rights: "Haki zote zimehifadhiwa.",
    products: "Bidhaa",
    orders: "Oda",
    returns: "Returns",
    shipping: "Shipping",
    faqs: "FAQs",
    myAccount: "Akaunti Yangu",
    terms: "Masharti na Vigezo",
    privacy: "Sera ya Faragha",
    noProducts: "Hakuna bidhaa zilizopatikana.",
    added: "imeongezwa kwenye cart.",
    shopNow: "Nunua Sasa",
  },
  en: {
    home: "Home",
    shop: "Shop",
    categories: "Categories",
    about: "About Us",
    contact: "Contact",
    search: "Search products...",
    featured: "Featured Products",
    viewAll: "View all",
    cart: "Cart",
    freeDelivery: "RELIABLE DELIVERY • SECURE SHOPPING",
    deliveryTitle: "RELIABLE DELIVERY",
    deliveryText: "We make sure your order arrives safely",
    secureTitle: "SECURITY",
    secureText: "Usalama wa taarifa zako ni 100%",
    qualityTitle: "QUALITY PRODUCTS",
    qualityText: "Genuine, reliable quality products",
    supportTitle: "CUSTOMER SUPPORT",
    supportText: "24/7 tuko tayari kukuhudumia",
    quickLinks: "QUICK LINKS",
    customerService: "CUSTOMER SERVICE",
    newsletter: "NEWSLETTER",
    newsletterText: "Subscribe to get updates on new products and exclusive offers.",
    emailPlaceholder: "Enter your email",
    subscribe: "Subscribe",
    rights: "All rights reserved.",
    products: "Products",
    orders: "Orders",
    returns: "Returns",
    shipping: "Shipping",
    faqs: "FAQs",
    myAccount: "My Account",
    terms: "Terms & Conditions",
    privacy: "Privacy Policy",
    noProducts: "No products found.",
    added: "has been added to your cart.",
    shopNow: "Shop Now",

    marquee:
      "🇬🇧 WELCOME TO GAMORA ONLINE • SHOP EASILY • CHOOSE WITH CONFIDENCE •",

    safeOrder:
      "Safe ordering",

    safeInfo:
      "Your information is 100% secure.",

    realProducts:
      "Quality and genuine products.",

    aboutText:
      "GAMORA ONLINE is your trusted online shop for quality products at affordable prices.",
  },
};

export default function HomePage() {
  const [language, setLanguage] = useState<Language>("sw");

  useEffect(() => {
    const savedLanguage = localStorage.getItem("gamora_language");
    if (savedLanguage === "sw" || savedLanguage === "en") {
      setLanguage(savedLanguage);
    }
  }, []);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cartCount, setCartCount] = useState(0);

  const t = translations[language];

  useEffect(() => {
    loadProducts();
    updateCartCount();

    const onStorage = () => updateCartCount();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
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
    const savedCart = localStorage.getItem("gamora_cart");
    if (!savedCart) {
      setCartCount(0);
      return;
    }

    try {
      const cart: CartItem[] = JSON.parse(savedCart);
      setCartCount(cart.reduce((total, item) => total + item.quantity, 0));
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

    const existing = cart.find((item) => item.id === product.id);
    if (existing) existing.quantity += 1;
    else cart.push({ ...product, quantity: 1 });

    localStorage.setItem("gamora_cart", JSON.stringify(cart));
    updateCartCount();
    alert(`${product.name} ${t.added}`);
  }

  const categories = useMemo(() => {
    return ["All", ...Array.from(new Set(products.map((product) => product.category)))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = search.toLowerCase().trim();
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query);
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  const featuredProducts = filteredProducts
    .filter((product) => product.image && product.image.trim() !== "")
    .slice(0, 4);

  return (
    

<main className="min-h-screen bg-white text-slate-900">

      {/* MOVING WELCOME BAR */}
      <div className="w-full overflow-hidden bg-[#E30613] py-2.5 text-white shadow-sm">
        <div className="flex w-max gamora-marquee whitespace-nowrap">
          <span className="mx-10 text-sm font-black tracking-wide sm:text-base">
            {t.marquee}
          </span>
          <span className="mx-10 text-sm font-black tracking-wide sm:text-base">
            {t.marquee}
          </span>
          <span className="mx-10 text-sm font-black tracking-wide sm:text-base">
            {t.marquee}
          </span>
          <span className="mx-10 text-sm font-black tracking-wide sm:text-base">
            {t.marquee}
          </span>
        </div>
      </div>

      {/* TOP RED BAR */}
      <div className="bg-[#e30613] px-4 py-2 text-center text-xs font-bold text-white sm:text-sm">
        <div className="mx-auto flex max-w-[1180px] items-center justify-center">
          <span>🚚 {t.freeDelivery}</span>
        </div>
      </div>

      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1180px] px-4">
          <div className="flex min-h-[82px] items-center gap-5">
            <a href="/" className="shrink-0" aria-label="GAMORA ONLINE home">
              <img src="/gamora-logo.png" alt="Gamora Online" className="h-14 w-auto object-contain sm:h-16" />
            </a>

            <nav className="hidden items-center gap-7 text-sm font-bold lg:flex">

  <a
    href="/"
    className="relative py-7 text-[#e30613] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-[#e30613]"
  >
    {t.home}
  </a>

  <a
    href="#products"
    className="py-7 transition hover:text-[#e30613]"
  >
    {t.shop}
  </a>

  {/* CATEGORY MEGA MENU */}
  <div className="group relative">

    <button
      type="button"
      className="flex items-center gap-1 py-7 transition hover:text-[#e30613]"
    >
      <span>{t.categories}</span>
      <span className="text-xs transition group-hover:rotate-180">⌄</span>
    </button>

    <div className="invisible absolute left-1/2 top-full z-50 w-[720px] -translate-x-1/2 translate-y-2 overflow-hidden rounded-2xl border border-slate-200 bg-white opacity-0 shadow-2xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">

      <div className="grid grid-cols-[220px_1fr]">

        {/* LEFT CATEGORY COLUMN */}
        <div className="bg-purple-800 p-4">
          <p className="mb-3 px-3 text-[11px] font-black uppercase tracking-widest text-[#F28C28]">
            GAMORA ONLINE
          </p>

          <div className="space-y-1">
            {categories.filter((category) => category !== "All").map((category) => {
              const icon =
                category === "Women's Fashion" ? "👗" :
                category === "Men's Fashion" ? "👔" :
                category === "Shoes" ? "👟" :
                category === "Phones & Electronics" ? "📱" :
                category === "Home & Kitchen" ? "🏠" :
                category === "Accessories" ? "👜" :
                "🛍️";

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-black text-white transition ${
                    selectedCategory === category
                      ? "bg-[#E30613]"
                      : "hover:bg-[#E30613]"
                  }`}
                >
                  <span>{icon} {category}</span>
                  <span>›</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setSelectedCategory("All")}
            className="mt-4 w-full rounded-xl border border-white/20 px-3 py-2.5 text-xs font-black text-white transition hover:bg-white hover:text-slate-700"
          >
            Angalia Bidhaa Zote →
          </button>
        </div>

        {/* RIGHT CATEGORY CONTENT */}
        <div className="bg-white p-7">

          <p className="text-xs font-black uppercase tracking-widest text-[#E30613]">
            SHOP BY CATEGORY
          </p>

          <h3 className="mt-2 text-2xl font-black text-purple-900">
            Chagua Unachotafuta
          </h3>

          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            Pitia makundi yetu na uchague bidhaa unayotaka kwa haraka.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">

            <button
              type="button"
              onClick={() => setSelectedCategory("Women's Fashion")}
              className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-[#E30613] hover:bg-red-50"
            >
              <div className="h-28 overflow-hidden rounded-lg bg-slate-100">
                <img src="/images/womens-fashion.jpg" alt="Women's Fashion" className="h-full w-full object-cover" />
              </div>
              <p className="mt-2 text-sm font-black text-purple-900">
                Women's Fashion
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory("Men's Fashion")}
              className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-[#E30613] hover:bg-red-50"
            >
              <div className="h-28 overflow-hidden rounded-lg bg-slate-100">
                <img src="/images/mens-fashion.jpg" alt="Men's Fashion" className="h-full w-full object-cover" />
              </div>
              <p className="mt-2 text-sm font-black text-purple-900">
                Men's Fashion
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory("Shoes")}
              className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-[#E30613] hover:bg-red-50"
            >
              <div className="h-28 overflow-hidden rounded-lg bg-slate-100">
                <img src="/images/shoes.jpg" alt="Shoes" className="h-full w-full object-cover" />
              </div>
              <p className="mt-2 text-sm font-black text-purple-900">
                Shoes
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory("Phones & Electronics")}
              className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-[#E30613] hover:bg-red-50"
            >
              <div className="h-28 overflow-hidden rounded-lg bg-slate-100">
                <img src="/images/phone.jpg" alt="Phones & Electronics" className="h-full w-full object-cover" />
              </div>
              <p className="mt-2 text-sm font-black text-purple-900">
                Phones & Electronics
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory("Home & Kitchen")}
              className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-[#E30613] hover:bg-red-50"
            >
              <div className="h-28 overflow-hidden rounded-lg bg-slate-100">
                <img src="/images/home-kitchen.jpg" alt="Home & Kitchen" className="h-full w-full object-cover" />
              </div>
              <p className="mt-2 text-sm font-black text-purple-900">
                Home & Kitchen
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory("Accessories")}
              className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-[#E30613] hover:bg-red-50"
            >
              <div className="h-28 overflow-hidden rounded-lg bg-slate-100">
                <img src="/images/accessories.jpg" alt="Accessories" className="h-full w-full object-cover" />
              </div>
              <p className="mt-2 text-sm font-black text-purple-900">
                Accessories
              </p>
            </button>

          </div>

        </div>

      </div>
    </div>

  </div>

  <a
    href="#about"
    className="py-7 transition hover:text-[#e30613]"
  >
    {t.about}
  </a>

  <a
    href="/contact"
    className="py-7 transition hover:text-[#e30613]"
  >
    {t.contact}
  </a>

</nav>

            <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
              <div className="relative hidden w-52 xl:block">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.search}
                  className="w-full rounded-full border border-slate-300 bg-white py-3 pl-5 pr-12 text-sm outline-none transition focus:border-[#e30613]"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg">⌕</span>
              </div>

              <div className="hidden items-center rounded-lg border border-slate-200 bg-white p-1 text-xs font-black sm:flex">
                <button
                  type="button"
                  onClick={() => {
                    setLanguage("sw");
                    localStorage.setItem("gamora_language", "sw");
                  }}
                  className={`rounded-md px-2.5 py-1.5 transition ${
                    language === "sw"
                      ? "bg-[#e30613] text-white"
                      : "text-slate-600 hover:text-[#e30613]"
                  }`}
                >
                  SW
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLanguage("en");
                    localStorage.setItem("gamora_language", "en");
                  }}
                  className={`rounded-md px-2.5 py-1.5 transition ${
                    language === "en"
                      ? "bg-[#e30613] text-white"
                      : "text-slate-600 hover:text-[#e30613]"
                  }`}
                >
                  EN
                </button>
              </div>

              <span
                className="hidden cursor-default select-none text-2xl md:block"
                aria-hidden="true"
              >
                ♙
              </span>

              <a href="/cart" className="relative text-2xl" aria-label={`${t.cart}: ${cartCount}`}>
                🛒
                {cartCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e30613] px-1 text-[10px] font-black text-white">
                    {cartCount}
                  </span>
                )}
              </a>
            </div>
          </div>

          <div className="pb-4 lg:hidden">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.search}
              className="w-full rounded-full border border-slate-300 px-5 py-3 text-sm outline-none focus:border-[#e30613]"
            />
          </div>
        </div>
      </header>

      {/* FEATURED PRODUCTS */}
      <section id="products" className="mx-auto max-w-[1180px] px-4 py-6 sm:py-7">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black sm:text-2xl">{t.featured}</h1>
            {selectedCategory !== "All" && (
              <button
                onClick={() => setSelectedCategory("All")}
                className="mt-1 text-xs font-bold text-[#e30613] hover:underline"
              >
                {selectedCategory} ×
              </button>
            )}
          </div>
          <button
            onClick={() => setSelectedCategory("All")}
            className="text-sm font-bold text-[#e30613] transition hover:text-[#c9000b]"
          >
            {t.viewAll} <span className="ml-1">›</span>
          </button>
        </div>

        {featuredProducts.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} addToCart={addToCart} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 py-20 text-center text-slate-500">{t.noProducts}</div>
        )}
      </section>

      {/* BENEFITS */}
      <section className="mx-auto max-w-[1180px] px-4 pb-5">
        <div className="grid overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-2 lg:grid-cols-4">

          <Benefit
            title="DELIVERY YA UHAKIKA"
            text={t.safeOrder}
          />

          <Benefit
            title="USALAMA"
            text={t.safeInfo}
          />

          <Benefit
            title="BIDHAA BORA"
            text={t.realProducts}
          />

          <Benefit
            title="HUDUMA KWA WATEJA"
            text="Tuko tayari kukusaidia 24/7."
          />

        </div>
      </section>

      {/* FOOTER */}
      <footer id="about" className="border-t border-slate-200 bg-white text-slate-900">
        <div className="mx-auto max-w-[1180px] px-4 py-10">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">

            <div>
              <div className="text-2xl font-black leading-none">
                <span className="text-slate-900">GAMORA</span>
                <span className="block text-[#E30613]">ONLINE</span>
              </div>

              <p className="mt-4 max-w-xs text-sm leading-6 text-slate-600">
                {t.aboutText}
              </p>

              <div className="mt-5 text-left">
                <p className="text-xs font-black text-slate-900">
                  Tufuatilie (@gamoraonline)
                </p>

                <div className="mt-3 flex items-center gap-3">
                  <a
                    href="https://web.facebook.com/gamoraonline/"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Facebook"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white hover:border-[#1877F2]"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-[#1877F2]">
                      <path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.7V4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.1H8v3h2.6v8h2.9Z"/>
                    </svg>
                  </a>

                  <a
                    href="https://www.instagram.com/gamoraonline_store/"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white hover:border-[#E1306C]"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-[#E1306C]" strokeWidth="1.8">
                      <rect x="3" y="3" width="18" height="18" rx="5"/>
                      <circle cx="12" cy="12" r="4"/>
                      <circle cx="17.4" cy="6.7" r="1" className="fill-[#E1306C] stroke-none"/>
                    </svg>
                  </a>

                  <a
                    href="https://www.tiktok.com/@officialgamoraonline"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="TikTok"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white hover:border-slate-900"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-slate-900">
                      <path d="M15.7 4c.4 2.3 1.7 3.8 4 4v3.1c-1.5.1-2.8-.4-4-1.1v6.2c0 4-2.6 6.1-5.7 6.1-3 0-5.3-2.1-5.3-5.1 0-3.2 2.6-5.4 6.3-5.2v3.1c-1.8-.2-3 .7-3 2 0 1.1.8 2 2 2 1.4 0 2.4-.9 2.4-2.8V4h3.3Z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-black text-slate-900">
                NAVIGATION
              </h3>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <a href="/" className="block hover:text-[#E30613]">Home</a>
                <a href="#products" className="block hover:text-[#E30613]">Shop</a>
                <a href="#products" className="block hover:text-[#E30613]">{t.categories}</a>
                <a href="#about" className="block hover:text-[#E30613]">{t.about}</a>
                <a href="/contact" className="block hover:text-[#E30613]">{t.contact}</a>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-black text-slate-900">
                {t.supportTitle}
              </h3>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>{language === "sw" ? "Jinsi ya Kununua" : "How to Buy"}</p>
                <p>{language === "sw" ? "Sera ya Uwasilishaji" : "Delivery Policy"}</p>
                <p>{language === "sw" ? "Sera ya Marejesho" : "Return Policy"}</p>
                <p>{language === "sw" ? "Masharti na Vigezo" : "Terms & Conditions"}</p>
                <p>{t.supportText}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-black text-slate-900">
                {t.newsletter}
              </h3>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {t.newsletterText}
              </p>

              <div className="mt-4 flex overflow-hidden rounded-lg border border-slate-300">
                <input
                  type="email"
                  placeholder="Weka email yako"
                  className="min-w-0 flex-1 px-4 py-3 text-sm outline-none"
                />
                <button
                  type="button"
                  className="bg-[#E30613] px-5 text-sm font-black text-white"
                >
                  {t.subscribe}
                </button>
              </div>
            </div>

          </div>

          <div className="mt-9 border-t border-slate-200 pt-5 text-center text-xs text-slate-500">
            © 2025 Gamora Online. {t.rights}
          </div>
        </div>
      </footer>
    </main>
  );
}



function FooterLinks({
  title,
  links,
}: {
  title: string;
  links: Array<[string, string] | { label: string; href: string }>;
}) {
  return (
    <div>
      <h3 className="text-sm font-black tracking-wide text-[#f28c28]">
        {title}
      </h3>

      <ul className="mt-4 space-y-2.5 text-sm text-slate-300">
        {links.map((link) => {
          const [label, href] = Array.isArray(link)
            ? link
            : [link.label, link.href];

          return (
            <li key={`${label}-${href}`}>
              <a
                href={href}
                className="transition hover:text-white"
              >
                {label}
              </a>
            </li>
          );
        })}
      </ul>
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
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-500 text-sm font-bold text-white transition hover:border-[#e30613] hover:bg-[#e30613]"
    >
      {icon}
    </a>
  );
}


function Benefit({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="flex min-h-[92px] items-center justify-center border-b border-slate-200 px-4 py-4 text-center sm:border-r lg:border-b-0 lg:last:border-r-0">
      <div>
        <h3 className="text-xs font-black tracking-wide text-[#071B3A]">
          {title}
        </h3>

        <p className="mt-1.5 text-xs leading-5 text-slate-600">
          {text}
        </p>

        <div className="mx-auto mt-2 h-0.5 w-6 bg-[#E30613]" />
      </div>
    </div>
  );
}

function ProductCard({
  product,
  addToCart,
}: {
  product: Product;
  addToCart: (product: Product) => void;
}) {
  const oldPrice =
    typeof product.oldPrice === "number"
      ? product.oldPrice
      : undefined;

  const discount =
    oldPrice !== undefined && oldPrice > product.price
      ? Math.round(((oldPrice - product.price) / oldPrice) * 100)
      : 0;

  return (
    <article className="group overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-2xl">
      <a
        href={`/product/${product.id}`}
        className="relative block aspect-square overflow-hidden bg-white"
      >
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-white text-5xl text-slate-300">
            🛍️
          </div>
        )}

        {discount > 0 && (
          <span className="absolute left-2 top-2 rounded-md bg-[#e30613] px-2 py-1 text-[10px] font-black text-white">
            -{discount}%
          </span>
        )}
      </a>

      <div className="p-3">
        <p className="mb-1 text-[11px] font-black uppercase tracking-wide text-slate-600">
          {product.category}
        </p>

        <a href={`/product/${product.id}`}>
          <h3 className="text-sm font-black text-slate-900 transition hover:text-[#e30613]">
            {product.name}
          </h3>
        </a>

        <div className="mt-2 flex items-center gap-2 rounded-lg bg-white px-2 py-1">
          <span
            className="text-lg font-black tracking-[2px]"
            style={{ color: "#D4AF37" }}
          >
            ★★★★★
          </span>

          <span className="text-[10px] font-black text-slate-700">
            (New)
          </span>
        </div>

        <div className="mt-2 flex items-end justify-between gap-2">
          <div>
            <p className="text-base font-black text-slate-900">
              TSh {product.price.toLocaleString()}
            </p>

            {oldPrice !== undefined && oldPrice > product.price && (
              <p className="text-xs font-bold text-red-600 line-through decoration-red-600">
                TSh {oldPrice.toLocaleString()}
              </p>
            )}
          </div>

          {product.stock <= 0 ? (
            <span className="text-xs font-black uppercase text-red-600">
              OUT OF STOCK
            </span>
          ) : (
            <button
              type="button"
              onClick={() => addToCart(product)}
              className="flex h-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-black text-slate-700 transition hover:border-[#e30613] hover:bg-red-50"
              aria-label={`Add ${product.name} to cart`}
            >
              🛒
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
