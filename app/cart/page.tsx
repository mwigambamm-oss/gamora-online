"use client";

import { useEffect, useState } from "react";

type CartItem = {
  id: number;
  name: string;
  price: number;
  oldPrice?: number;
  stock: number;
  quantity: number;
  image?: string;
};

export default function CartPage() {
  const [language, setLanguage] = useState<"sw" | "en">("sw");

  useEffect(() => {
    const savedLanguage = localStorage.getItem("gamora_language");
    if (savedLanguage === "sw" || savedLanguage === "en") {
      setLanguage(savedLanguage);
    }
  }, []);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("gamora_cart");

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setCart(parsed);
        }
      }
    } catch {
      setCart([]);
    }
  }, []);

  function saveCart(updatedCart: CartItem[]) {
    setCart(updatedCart);
    localStorage.setItem("gamora_cart", JSON.stringify(updatedCart));
  }

  function increase(id: number) {
    const updated = cart.map((item) =>
      item.id === id
        ? { ...item, quantity: item.quantity + 1 }
        : item
    );

    saveCart(updated);
  }

  function decrease(id: number) {
    const updated = cart
      .map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity - 1) }
          : item
      );

    saveCart(updated);
  }

  function removeItem(id: number) {
    const updated = cart.filter((item) => item.id !== id);
    saveCart(updated);
  }

const subtotal: number = cart.reduce(
  (total: number, item: CartItem) =>
    total +
    Number(item.price) * Number(item.quantity),
  0
);

const discountTotal: number = cart.reduce(
  (total: number, item: CartItem) => {
    const oldPrice = Number(item.oldPrice || 0);
    const price = Number(item.price || 0);
    const quantity = Number(item.quantity || 0);

    if (oldPrice > price) {
      return total + (oldPrice - price) * quantity;
    }

    return total;
  },
  0
);

const discountedSubtotal =
  subtotal - discountTotal;

const deliveryFee: number =
  cart.length > 0 ? 0 : 0;

const total =
  discountedSubtotal + deliveryFee;

  const sw = {
    cart: "Shopping Cart",
    empty: "Cart yako ipo tupu",
    emptyText: "Chagua bidhaa kwenye GAMORA ONLINE ili kuanza shopping.",
    shop: "Endelea Shopping",
    quantity: "Idadi",
    remove: "Ondoa",
    subtotal: "Jumla ya Bidhaa",
    discount: "Punguzo la Jumla",
    delivery: "Delivery",
    calculated: "Itahesabiwa Checkout",
    total: "Jumla",
    checkout: "Endelea Checkout",
    back: "← Rudi Home",
  };

  const en = {
    cart: "Shopping Cart",
    empty: "Your cart is empty",
    emptyText:
      "Choose products from GAMORA ONLINE to start shopping.",
    shop: "Continue Shopping",
    quantity: "Quantity",
    remove: "Remove",
    subtotal: "Subtotal",
    discount: "Total Discount",
    delivery: "Delivery",
    calculated: "Calculated at Checkout",
    total: "Total",
    checkout: "Proceed to Checkout",
    back: "← Back Home",
  };

  const t = language === "sw" ? sw : en;

  return (
    <main className="min-h-screen bg-slate-50">

      {/* TOP BAR */}
      <div className="bg-sky-950 px-4 py-2 text-center text-sm text-white">
        🌊 GAMORA ONLINE • Kariakoo, Dar es Salaam
      </div>

      {/* HEADER */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">

          <a
            href="/"
            className="flex shrink-0 items-center"
          >
            <img
              src="/gamora-logo.png"
              alt="Gamora Online"
              className="h-14 w-auto object-contain"
            />
          </a>

          <div className="flex gap-2">

            <button
              onClick={() => {
                setLanguage("sw");
                localStorage.setItem("gamora_language", "sw");
              }}
              className={`rounded-lg px-3 py-2 text-xs font-bold ${
                language === "sw"
                  ? "bg-sky-700 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              🇹🇿 SW
            </button>

            <button
              onClick={() => {
                setLanguage("en");
                localStorage.setItem("gamora_language", "en");
              }}
              className={`rounded-lg px-3 py-2 text-xs font-bold ${
                language === "en"
                  ? "bg-sky-700 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              🇬🇧 EN
            </button>

          </div>

        </div>
      </header>

      {/* CONTENT */}
      <section className="mx-auto max-w-6xl px-4 py-12">

        <div className="mb-8 flex items-center justify-between">

          <div>
            <p className="font-bold text-sky-600">
              GAMORA ONLINE
            </p>

            <h1 className="mt-1 text-3xl font-black md:text-4xl">
              🛒 {t.cart}
            </h1>
          </div>

          <a
            href="/"
            className="hidden rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold hover:bg-slate-100 sm:block"
          >
            {t.back}
          </a>

        </div>

        {/* EMPTY CART */}
        {cart.length === 0 ? (

          <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-sm">

            <div className="text-7xl">
              🛒
            </div>

            <h2 className="mt-6 text-2xl font-black">
              {t.empty}
            </h2>

            <p className="mx-auto mt-3 max-w-md text-slate-500">
              {t.emptyText}
            </p>

            <a
              href="/"
              className="mt-7 inline-block rounded-lg bg-sky-700 px-7 py-4 font-black text-white hover:bg-sky-800"
            >
              {t.shop}
            </a>

          </div>

        ) : (

          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">

            {/* CART ITEMS */}
            <div className="space-y-4">

              {cart.map((item) => (

                <div
                  key={item.id}
                  className="rounded-2xl bg-white p-5 shadow-sm"
                >

                  <div className="flex gap-4">

                    {/* IMAGE */}
                    <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-sky-50">

                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-5xl">
                          🛍️
                        </span>
                      )}

                    </div>

                    {/* DETAILS */}
                    <div className="min-w-0 flex-1">

                      <h2 className="font-black text-slate-900">
                        {item.name}
                      </h2>

                      <p className="mt-2 font-bold text-sky-700">
                        TZS {item.price.toLocaleString()}
                      </p>

                      <p className="mt-2 text-sm text-slate-500">
                        {t.quantity}
                      </p>

                      <div className="mt-2 flex items-center gap-3">

                        <button
                          onClick={() => decrease(item.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-lg font-black hover:bg-slate-200"
                        >
                          −
                        </button>

                        <span className="min-w-6 text-center font-black">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() => increase(item.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-700 text-lg font-black text-white hover:bg-sky-800"
                        >
                          +
                        </button>

                      </div>

                    </div>

                    {/* REMOVE */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="self-start text-sm font-bold text-red-500 hover:text-red-700"
                    >
                      🗑️ {t.remove}
                    </button>

                  </div>

                </div>

              ))}

            </div>

            {/* SUMMARY */}
            <div className="h-fit rounded-2xl bg-white p-6 shadow-sm lg:sticky lg:top-6">

              <h2 className="text-xl font-black">
                Order Summary
              </h2>

              <div className="mt-6 space-y-4">

                <div className="flex justify-between gap-4 text-slate-600">
                  <span>{t.subtotal}</span>

                  <span className="font-bold text-slate-900">
                    TZS {subtotal.toLocaleString()}
                  </span>
                </div>

                {discountTotal > 0 && (
                  <div className="flex justify-between gap-4 text-green-600">
                    <span>{t.discount}</span>

                    <span className="font-bold">
                      - TZS {discountTotal.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex justify-between gap-4 text-slate-600">
                  <span>{t.delivery}</span>

                  <span className="text-right text-sm font-bold text-sky-700">
                    {deliveryFee === 0
                      ? t.calculated
                      : `TZS ${deliveryFee.toLocaleString()}`}
                  </span>
                </div>

                <div className="border-t pt-4">

                  <div className="flex justify-between gap-4">

                    <span className="text-lg font-black">
                      {t.total}
                    </span>

                    <span className="text-lg font-black text-sky-700">
                      TZS {total.toLocaleString()}
                    </span>

                  </div>

                </div>

              </div>

              <a
                href="/checkout"
                className="mt-7 block rounded-lg bg-sky-700 px-6 py-4 text-center font-black text-white hover:bg-sky-800"
              >
                {t.checkout}
              </a>

              <a
                href="/"
                className="mt-3 block rounded-lg border border-slate-200 px-6 py-4 text-center font-bold text-slate-700 hover:bg-slate-50"
              >
                {t.shop}
              </a>

            </div>

          </div>

        )}

      </section>

      {/* FOOTER */}
      <footer className="bg-sky-950 px-4 py-10 text-center text-sky-200">

        <div className="text-xl font-black text-white">
          GAMORA
          <span className="text-sky-300">ONLINE</span>
        </div>

        <p className="mt-3 text-sm">
          📍 Kariakoo, Dar es Salaam, Tanzania
        </p>

        <p className="mt-1 text-sm">
          ☎️ +255 798 555 221
        </p>

        <a
          href="/"
          className="mt-6 inline-block font-bold text-white hover:text-sky-300"
        >
          {t.back}
        </a>

        <div className="mt-8 border-t border-sky-800 pt-6 text-xs">
          © {new Date().getFullYear()} GAMORA ONLINE. All rights reserved.
        </div>

      </footer>

    </main>
  );
}
