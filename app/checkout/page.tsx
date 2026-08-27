"use client";

import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";

type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  stock?: number;
  image?: string;
};

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("gamora_cart");

    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch {
        setCart([]);
      }
    }
  }, []);

  const subtotal = useMemo(() => {
    return cart.reduce(
      (sum, item) =>
        sum + Number(item.price) * Number(item.quantity),
      0
    );
  }, [cart]);

  async function placeOrder(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!paymentMethod) {
      alert("Chagua njia ya malipo");
      return;
    }

    const newOrderNumber =
      "GAM-" + Date.now().toString().slice(-8);

    const order = {
      id: newOrderNumber,
      customer: {
        name,
        phone,
        address,
      },
      items: cart,
      subtotal,
      total: subtotal,
      paymentMethod,
      status: "Pending",
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(order),
      });

      if (!response.ok) {
        throw new Error("Failed to save order");
      }

      // STAKABA PAYMENT
      if (
        paymentMethod === "M-Pesa" ||
        paymentMethod === "Mix by Yas"
      ) {
        const network =
          paymentMethod === "M-Pesa"
            ? "mpesa"
            : "mixx";

        await fetch("/api/payments/stakaba", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: subtotal,
            mobileNumber: phone,
            network,
            orderId: newOrderNumber,
          }),
        });
      }

      localStorage.removeItem("gamora_cart");

      setOrderNumber(newOrderNumber);
      setOrderPlaced(true);

    } catch (error) {
      console.error(error);
      alert("Order imeshindikana");
    }
  }
  if (orderPlaced) {
    return (
      <main className="min-h-screen bg-slate-50 p-10">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-10 text-center shadow">

          <div className="text-6xl">
            ✅
          </div>

          <h1 className="mt-5 text-3xl font-black">
            Order imepokelewa
          </h1>

          <p className="mt-4">
            Order Number:
          </p>

          <p className="text-2xl font-black text-sky-700">
            {orderNumber}
          </p>

          <a
            href="/"
            className="mt-8 inline-block rounded-lg bg-sky-700 px-8 py-3 font-bold text-white"
          >
            Rudi Home
          </a>

        </div>
      </main>
    );
  }


  return (
    <main className="min-h-screen bg-slate-50 p-5">

      <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow">

        <h1 className="text-3xl font-black">
          GAMORA ONLINE Checkout
        </h1>

        <p className="mt-2">
          Jumla: TZS {subtotal.toLocaleString()}
        </p>


        <form
          onSubmit={placeOrder}
          className="mt-8 space-y-4"
        >

          <input
            className="w-full rounded-lg border p-3"
            placeholder="Jina"
            value={name}
            onChange={(e)=>setName(e.target.value)}
          />


          <input
            className="w-full rounded-lg border p-3"
            placeholder="Namba ya simu"
            value={phone}
            onChange={(e)=>setPhone(e.target.value)}
          />


          <input
            className="w-full rounded-lg border p-3"
            placeholder="Address / Eneo"
            value={address}
            onChange={(e)=>setAddress(e.target.value)}
          />


          <select
            className="w-full rounded-lg border p-3"
            value={paymentMethod}
            onChange={(e)=>setPaymentMethod(e.target.value)}
          >

            <option value="">
              Chagua malipo
            </option>

            <option value="M-Pesa">
              M-Pesa
            </option>

            <option value="Mix by Yas">
              Mix by Yas
            </option>

            <option value="Cash">
              Cash
            </option>

          </select>


          <button
            type="submit"
            className="w-full rounded-lg bg-sky-700 p-4 font-black text-white"
          >
            Weka Order
          </button>


        </form>

      </div>

    </main>
  );
}
