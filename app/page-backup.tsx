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
    viewAll: "Angalia Zote",
    cart: "Cart",
    freeDelivery: "DELIVERY BURE KWA ODA ZINAZOZIDI TSH 100,000",
    deliveryTitle: "DELIVERY BURE",
    deliveryText: "Kwa oda zinazozidi TSh 100,000",
    secureTitle: "MALIPO SALAMA",
    secureText: "100% secure payment guaranteed",
    qualityTitle: "BIDHAA BORA",
    qualityText: "Tunatoa bidhaa zenye ubora bora",
    supportTitle: "HUDUMA KWA WATEJA",
    supportText: "Tupo hapa kukusaidia 24/7",
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
    freeDelivery: "FREE DELIVERY ON ORDERS ABOVE TSH 100,000",
    deliveryTitle: "FREE DELIVERY",
    deliveryText: "On orders above TSh 100,000",
    secureTitle: "SECURE PAYMENT",
    secureText: "100% secure payment guaranteed",
    qualityTitle: "QUALITY PRODUCTS",
    qualityText: "We provide only the best quality",
    supportTitle: "CUSTOMER SUPPORT",
    supportText: "24/7 support — we're here to help",
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
  },
};

export default function HomePage() {
  const [language, setLanguage] = useState<Language>("sw");
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

  const featuredProducts = filteredProducts.slice(0, 5);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* TOP RED BAR */}
      <div className="bg-[#e30613] px-4 py-2 text-xs font-bold text-white sm:text-sm">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4">
          <span>🚚 {t.freeDelivery}</span>
          <div className="hidden items-center gap-4 text-base sm:flex" aria-label="Social media">
            <span>f</span><span>◎</span><span>♥</span><span>♪</span>
          </div>
        </div>
      </div>

      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1180px] px-4">
          <div className="flex min-h-[82px] items-center gap-5">
            <a href="/" className="shrink-0" aria-label="GAMORA ONLINE home">
              <img src="/gamora-logo.png" alt="Gamora Online" className="h-14 w-auto object-contain sm:h-16" />
            </a>

            <nav className="hidden items-center gap-8 text-sm font-bold lg:flex">
              <a href="/" className="relative py-7 text-[#e30613] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-[#e30613]">
                {t.home}
              </a>
              <a href="#products" className="py-7 transition hover:text-[#e30613]">{t.shop}</a>
              <div className="relative group">
                <button className="flex items-center gap-1 py-7 transition hover:text-[#e30613]" type="button">
                  {t.categories} <span className="text-xs">⌄</span>
                </button>
                <div className="invisible absolute left-0 top-full z-50 min-w-52 rounded-xl border bg-white p-2 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100">
                  {categories.filter((c) => c !== "All").map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-red-50 hover:text-[#e30613]"
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
              <a href="#about" className="py-7 transition hover:text-[#e30613]">{t.about}</a>
              <a href="/contact" className="py-7 transition hover:text-[#e30613]">{t.contact}</a>
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

              <button
                onClick={() => setLanguage(language === "sw" ? "en" : "sw")}
                className="hidden rounded-lg border border-slate-200 px-2 py-2 text-xs font-bold sm:block"
                aria-label="Change language"
              >
                {language === "sw" ? "SW" : "EN"}
              </button>

              <button className="hidden text-2xl md:block" aria-label="Account" type="button">♙</button>

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

      {/* ALL PRODUCTS — keeps existing shop/search functionality */}
      <section className="mx-auto max-w-[1180px] px-4 pb-10 pt-3">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black">{selectedCategory === "All" ? t.products : selectedCategory}</h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition ${
                  selectedCategory === category
                    ? "border-[#e30613] bg-[#e30613] text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-[#e30613] hover:text-[#e30613]"
                }`}
              >
                {category === "All" ? t.products : category}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {filteredProducts.map((product) => (
            <ProductCard key={`all-${product.id}`} product={product} addToCart={addToCart} />
          ))}
        </div>
      </section>

      {/* BENEFITS — realistic images like the supplied reference */}
      <section className="mx-auto max-w-[1180px] px-4 pb-7">
        <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:grid-cols-2 lg:grid-cols-4">
          <Benefit image="/images/delivery-van.jpg" title={t.deliveryTitle} text={t.deliveryText} />
          <Benefit image="/images/secure-payment.jpg" title={t.secureTitle} text={t.secureText} />
          <Benefit image="/images/quality-products.jpg" title={t.qualityTitle} text={t.qualityText} />
          <Benefit image="/images/customer-support.jpg" title={t.supportTitle} text={t.supportText} />
        </div>
      </section>

      {/* FOOTER */}
      <footer id="about" className="bg-[#071b3a] text-white">
        <div className="mx-auto max-w-[1180px] px-4 py-11 sm:py-12">
          <div className="grid gap-9 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <img src="/gamora-logo.png" alt="Gamora Online" className="h-14 w-auto brightness-0 invert" />
              <p className="mt-4 max-w-xs text-sm leading-6 text-slate-300">
                {language === "sw"
                  ? "GAMORA ONLINE ni duka lako la kuaminika kwa bidhaa bora kwa bei nzuri. Nunua smart, ishi better."
                  : "GAMORA ONLINE is your trusted online store for quality products at unbeatable prices. Shop smart, live better."}
              </p>
              <div className="mt-5 flex gap-3">
                <SocialButton icon="f" label="Facebook" href="https://web.facebook.com/gamoraonline/" />
                <SocialButton icon="◎" label="Instagram" href="https://www.instagram.com/gamoraonline_store/" />
                <SocialButton icon="♥" label="Twitter" href="#" />
                <SocialButton icon="♪" label="TikTok" href="https://www.tiktok.com/@officialgamoraonline" />
              </div>
            </div>

            <FooterLinks title={t.quickLinks} links={[
              [t.home, "/"], [t.shop, "#products"], [t.categories, "#products"], [t.about, "#about"], [t.contact, "/contact"],
            ]} />

            <FooterLinks title={t.customerService} links={[
              [t.myAccount, "/account"], [t.orders, "/orders"], [t.returns, "/returns"], [t.shipping, "/delivery"], [t.faqs, "/help"],
            ]} />

            <div>
              <h3 className="text-sm font-black tracking-wide text-[#f28c28]">{t.newsletter}</h3>
              <p className="mt-4 text-sm leading-6 text-slate-300">{t.newsletterText}</p>
              <div className="mt-5 flex overflow-hidden rounded-lg border border-slate-600">
                <input
                  type="email"
                  placeholder={t.emailPlaceholder}
                  className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-slate-400"
                />
                <button
                  className="w-14 bg-[#e30613] text-lg font-black transition hover:bg-[#c9000b]"
                  onClick={() => alert(language === "sw" ? "Asante! Umejiunga na GAMORA ONLINE." : "Thank you! You have subscribed to GAMORA ONLINE.")}
                  aria-label={t.subscribe}
                >
                  ➤
                </button>
              </div>
            </div>
          </div>

          <div className="mt-9 flex flex-col justify-between gap-4 border-t border-slate-700 pt-6 text-xs text-slate-300 sm:flex-row">
            <span>© {new Date().getFullYear()} GAMORA ONLINE. {t.rights}</span>
            <div className="flex gap-5">
              <a href="/terms" className="hover:text-white">{t.terms}</a>
              <span>|</span>
              <a href="/privacy" className="hover:text-white">{t.privacy}</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function ProductCard({ product, addToCart }: { product: Product; addToCart: (product: Product) => void }) {
  const isOutOfStock = product.stock <= 0;
  const discount = product.oldPrice && product.oldPrice > product.price
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  return (
    <article className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <a href={`/product/${product.id}`} className="relative block aspect-square overflow-hidden bg-slate-100">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl">🛍️</div>
        )}
        {discount > 0 && (
          <span className="absolute left-2 top-2 rounded-md bg-[#e30613] px-2 py-1 text-[10px] font-black text-white">-{discount}%</span>
        )}
      </a>

      <div className="p-3">
        <a href={`/product/${product.id}`} className="block min-h-10 line-clamp-2 text-sm font-bold leading-5 hover:text-[#e30613]">
          {product.name}
        </a>
        <div className="mt-2 flex items-center gap-1 text-sm text-[#e30613]">
          <span>★★★★★</span>
          <span className="text-[11px] text-slate-500">(New)</span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <div>
            <p className="text-base font-black text-[#e30613]">TSh {product.price.toLocaleString()}</p>
            {product.oldPrice && product.oldPrice > product.price && (
              <p className="text-xs text-slate-400 line-through">TSh {product.oldPrice.toLocaleString()}</p>
            )}
          </div>
          <button
            onClick={() => addToCart(product)}
            disabled={isOutOfStock}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg transition hover:border-[#e30613] hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`Add ${product.name} to cart`}
          >
            🛒
          </button>
        </div>
      </div>
    </article>
  );
}

function Benefit({ image, title, text }: { image: string; title: string; text: string }) {
  return (
    <div className="flex min-h-[150px] items-center gap-4 border-b border-slate-200 p-4 last:border-b-0 sm:p-5 sm:last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0">
      <div className="flex h-24 w-28 shrink-0 items-center justify-center overflow-hidden bg-white">
        <img
          src={image}
          alt={title}
          loading="lazy"
          className="h-full w-full object-contain"
        />
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-black text-slate-900">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
      </div>
    </div>
  );
}

function FooterLinks({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="text-sm font-black tracking-wide text-[#e30613]">{title}</h3>
      <ul className="mt-4 space-y-2.5 text-sm text-slate-300">
        {links.map(([label, href]) => (
          <li key={label}><a href={href} className="transition hover:text-white">{label}</a></li>
        ))}
      </ul>
    </div>
  );
}

function SocialButton({ icon, label, href }: { icon: string; label: string; href: string }) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-500 text-sm font-bold transition hover:border-[#e30613] hover:bg-[#e30613]"
    >
      {icon}
    </a>
  );
}
