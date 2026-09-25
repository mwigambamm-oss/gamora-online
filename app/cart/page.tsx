"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";

import { useEffect, useState } from "react";
import { formatCurrency, type Currency } from "@/lib/currency";

type CartItem = {
  id: number;
  variantId?: number | null;
  name: string;
  price: number;
  oldPrice?: number;
  stock: number;
  quantity: number;
  image?: string;
  selectedColor?: string;
  selectedSize?: string;
};

export default function CartPage() {
  const { language, setLanguage } = useLanguage();
  const [currency, setCurrency] = useState<Currency>("TZS");

  useEffect(() => {

    const savedCurrency = localStorage.getItem("gamora_currency");
    if (savedCurrency === "TZS" || savedCurrency === "USD") {
      setCurrency(savedCurrency);
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

  function isSameCartItem(
    item: CartItem,
    id: number,
    selectedColor?: string,
    selectedSize?: string,
    variantId?: number | null
  ) {
    return (
      item.id === id &&
      Number(item.variantId || 0) === Number(variantId || 0) &&
      (item.selectedColor || "") === (selectedColor || "") &&
      (item.selectedSize || "") === (selectedSize || "")
    );
  }

  function increase(
    id: number,
    selectedColor?: string,
    selectedSize?: string,
    variantId?: number | null
  ) {
    const updated = cart.map((item) => {
      if (!isSameCartItem(item, id, selectedColor, selectedSize, variantId)) {
        return item;
      }

      const maxStock = Number(item.stock || 0);
      const nextQuantity = Number(item.quantity || 0) + 1;

      return {
        ...item,
        quantity:
          maxStock > 0
            ? Math.min(maxStock, nextQuantity)
            : nextQuantity,
      };
    });

    saveCart(updated);
  }

  function decrease(
    id: number,
    selectedColor?: string,
    selectedSize?: string,
    variantId?: number | null
  ) {
    const updated = cart.map((item) =>
      isSameCartItem(item, id, selectedColor, selectedSize, variantId)
        ? {
            ...item,
            quantity: Math.max(1, Number(item.quantity || 0) - 1),
          }
        : item
    );

    saveCart(updated);
  }

  function removeItem(
    id: number,
    selectedColor?: string,
    selectedSize?: string,
    variantId?: number | null
  ) {
    const updated = cart.filter(
      (item) =>
        !isSameCartItem(item, id, selectedColor, selectedSize, variantId)
    );

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
      <div className="bg-sky-950 px-2 py-2 text-center text-xs text-white">
        🌊 GAMORA ONLINE • Kariakoo, Dar es Salaam
      </div>

      {/* HEADER */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-2 py-5">

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
              }}
              className={`rounded-lg px-3 py-2 text-xs font-normal ${
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
              }}
              className={`rounded-lg px-3 py-2 text-xs font-normal ${
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
      <section className="mx-auto max-w-6xl px-2 py-6">

        <div className="mb-8 flex items-center justify-between">

          <div>
            <p className="font-normal text-sky-600">
              GAMORA ONLINE
            </p>

            <h1 className="mt-1 text-xs font-medium md:text-lg">
              🛒 {t.cart}
            </h1>
          </div>

          <a
            href="/"
            className="hidden rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-normal hover:bg-slate-100 sm:block"
          >
            {t.back}
          </a>

        </div>

        {/* EMPTY CART */}
        {cart.length === 0 ? (

          <div className="rounded-2xl bg-white px-6 py-8 text-center shadow-sm">

            <div className="text-7xl">
              🛒
            </div>

            <h2 className="mt-6 text-sm font-medium">
              {t.empty}
            </h2>

            <p className="mx-auto mt-3 max-w-md text-slate-500">
              {t.emptyText}
            </p>

            <a
              href="/"
              className="mt-7 inline-block rounded-lg bg-sky-700 px-7 py-2 font-medium text-white hover:bg-sky-800"
            >
              {t.shop}
            </a>

          </div>

        ) : (

          <div className="grid gap-4 lg:grid-cols-[1fr_380px]">

            {/* CART ITEMS */}
            <div className="space-y-4">

              {cart.map((item) => (

                <div
                  key={`${item.id}-${item.variantId || 0}-${item.selectedColor || ""}-${item.selectedSize || ""}`}
                  className="rounded-2xl bg-white p-5 shadow-sm"
                >

                  <div className="flex gap-2">

                    {/* IMAGE */}
                    <div className="flex h-36 w-36 md:h-64 md:w-64 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sky-50">

                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-contain p-2"
                        />
                      ) : (
                        <span className="text-5xl">
                          🛍️
                        </span>
                      )}

                    </div>

                    {/* DETAILS */}
                    <div className="min-w-0 flex-1">

                      <h2 className="font-medium text-slate-900">
                        {item.name}
                      </h2>

                      <p className="mt-2 font-normal text-sky-700">
                        {formatCurrency(Number(item.price), currency)}
                      </p>

                      {(item.selectedColor || item.selectedSize) && (
                        <div className="mt-2 space-y-1 text-xs text-slate-500">
                          {item.selectedColor && (
                            <p>
                              <span className="font-medium text-slate-600">
                                {language === "sw" ? "Rangi" : "Colour"}:
                              </span>{" "}
                              {item.selectedColor}
                            </p>
                          )}

                          {item.selectedSize && (
                            <p>
                              <span className="font-medium text-slate-600">
                                {language === "sw" ? "Ukubwa" : "Size"}:
                              </span>{" "}
                              {item.selectedSize}
                            </p>
                          )}
                        </div>
                      )}

                      <p className="mt-2 text-xs text-slate-500">
                        {t.quantity}
                      </p>

                      <div className="mt-2 flex items-center gap-3">

                        <button
                          onClick={() => decrease(item.id, item.selectedColor, item.selectedSize, item.variantId)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-xs font-medium hover:bg-slate-200"
                        >
                          −
                        </button>

                        <span className="min-w-6 text-center font-medium">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() => increase(item.id, item.selectedColor, item.selectedSize, item.variantId)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-700 text-xs font-medium text-white hover:bg-sky-800"
                        >
                          +
                        </button>

                      </div>

                    </div>

                    {/* REMOVE */}
                    <button
                      onClick={() => removeItem(item.id, item.selectedColor, item.selectedSize, item.variantId)}
                      className="self-start text-xs font-normal text-red-500 hover:text-red-700"
                    >
                      🗑️ {t.remove}
                    </button>

                  </div>

                </div>

              ))}

            </div>

            {/* SUMMARY */}
            <div className="h-fit rounded-2xl bg-white p-6 shadow-sm lg:sticky lg:top-6">

              <h2 className="text-xs font-medium">
                Order Summary
              </h2>

              <div className="mt-6 space-y-4">

                <div className="flex justify-between gap-2 text-slate-600">
                  <span>{t.subtotal}</span>

                  <span className="font-normal text-slate-700">
                    {formatCurrency(subtotal, currency)}
                  </span>
                </div>

                {discountTotal > 0 && (
                  <div className="flex justify-between gap-2 text-green-600">
                    <span>{t.discount}</span>

                    <span className="font-normal">
                      - {formatCurrency(discountTotal, currency)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between gap-2 text-slate-600">
                  <span>{t.delivery}</span>

                  <span className="text-right text-xs font-normal text-sky-700">
                    {deliveryFee === 0
                      ? t.calculated
                      : formatCurrency(deliveryFee, currency)}
                  </span>
                </div>

                <div className="border-t pt-4">

                  <div className="flex justify-between gap-2">

                    <span className="text-xs font-medium">
                      {t.total}
                    </span>

                    <span className="text-xs font-medium text-sky-700">
                      {formatCurrency(total, currency)}
                    </span>

                  </div>

                </div>

              </div>

              <a
                href="/checkout"
                className="mt-7 block rounded-lg bg-sky-700 px-6 py-2 text-center font-medium text-white hover:bg-sky-800"
              >
                {t.checkout}
              </a>

              <a
                href="/"
                className="mt-3 block rounded-lg border border-slate-200 px-6 py-2 text-center font-normal text-slate-700 hover:bg-slate-50"
              >
                {t.shop}
              </a>

            </div>

          </div>

        )}

      </section>

      {/* FOOTER */}
      <footer className="bg-sky-950 px-2 py-5 text-center text-sky-200">

        <div className="text-xs font-medium text-white">
          GAMORA
          <span className="text-sky-300">ONLINE</span>
        </div>

        <p className="mt-3 text-xs">
          📍 Kariakoo, Dar es Salaam, Tanzania
        </p>

        <p className="mt-1 text-xs">
          ☎️ +255 798 555 221
        </p>

        <a
          href="/"
          className="mt-6 inline-block font-normal text-white hover:text-sky-300"
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
