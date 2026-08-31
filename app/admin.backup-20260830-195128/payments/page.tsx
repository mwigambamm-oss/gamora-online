"use client";

import { useEffect, useState } from "react";

type Order = {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  total: number;
  status: string;
  created_at: string;
};

type Payment = {
  id: number;
  order_number: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
};

const money = (n: number) =>
  `TZS ${Number(n || 0).toLocaleString()}`;

export default function PaymentsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [orderId, setOrderId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");

  async function load() {
    try {
      setLoading(true);

      const response = await fetch("/api/accounting/payments", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load payments");
      }

      setOrders(result.orders || []);
      setPayments(result.payments || []);
    } catch (error) {
      console.error(error);
      alert("Failed to load accounting data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function recordPayment() {
    if (!orderId || !amount || Number(amount) <= 0) {
      alert("Select an order and enter a valid payment amount.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/accounting/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: Number(orderId),
          amount: Number(amount),
          payment_method: method,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Payment failed");
      }

      alert("✅ Payment recorded successfully.");

      setOrderId("");
      setAmount("");
      setMethod("Cash");

      await load();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to record payment.");
    } finally {
      setSaving(false);
    }
  }

  const paidByOrder = new Map<string, number>();

  payments.forEach((payment) => {
    const current = paidByOrder.get(String(payment.order_number)) || 0;
    paidByOrder.set(
      String(payment.order_number),
      current + Number(payment.amount || 0)
    );
  });

  const unpaidOrders = orders.map((order) => {
    const paid = paidByOrder.get(String(order.order_number)) || 0;
    const balance = Math.max(Number(order.total) - paid, 0);

    return {
      ...order,
      paid,
      balance,
    };
  });

  const totalPaid = payments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );

  const totalOutstanding = unpaidOrders.reduce(
    (sum, order) => sum + order.balance,
    0
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-amber-50 p-5 text-slate-900 md:p-8">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-orange-400">
              GAMORA ONLINE
            </p>

            <h1 className="mt-1 text-3xl font-black text-slate-900">
              Payments Center
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Record customer payments and monitor outstanding balances.
            </p>
          </div>

          <button
            onClick={load}
            className="rounded-xl border border-slate-200/80 bg-white/75 backdrop-blur-sm shadow-sm/5 px-5 py-3 font-bold hover:bg-gray-100"
          >
            🔄 Refresh
          </button>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">

          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Recorded Payments
            </p>

            <p className="mt-2 text-3xl font-black text-slate-900 text-emerald-400">
              {money(totalPaid)}
            </p>
          </div>

          <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Outstanding
            </p>

            <p className="mt-2 text-3xl font-black text-slate-900 text-red-400">
              {money(totalOutstanding)}
            </p>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Payment Transactions
            </p>

            <p className="mt-2 text-3xl font-black text-slate-900">
              {payments.length}
            </p>
          </div>

        </div>

        <section className="mb-6 rounded-3xl border border-indigo-200 bg-indigo-50/70 p-6 shadow-sm">

          <h2 className="text-xl font-black text-slate-900">
            Record Customer Payment
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-4">

            <select
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="rounded-xl border border-slate-200/80 bg-white/75 backdrop-blur-sm shadow-sm text-gray-900 px-4 py-3 outline-none"
            >
              <option value="">
                Select Order
              </option>

              {unpaidOrders
                .filter((order) => order.balance > 0)
                .map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.order_number} — {order.customer_name} — {money(order.balance)}
                  </option>
                ))}
            </select>

            <input
              type="number"
              min="1"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-xl border border-slate-200/80 bg-white/75 backdrop-blur-sm shadow-sm text-gray-900 px-4 py-3 outline-none"
            />

            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="rounded-xl border border-slate-200/80 bg-white/75 backdrop-blur-sm shadow-sm text-gray-900 px-4 py-3 outline-none"
            >
              <option>Cash</option>
              <option>M-Pesa</option>
              <option>Tigo Pesa</option>
              <option>Airtel Money</option>
              <option>Bank</option>
              <option>Card</option>
            </select>

            <button
              onClick={recordPayment}
              disabled={saving}
              className="rounded-xl bg-orange-600 px-5 py-3 font-black hover:bg-orange-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "💰 Record Payment"}
            </button>

          </div>
        </section>

        <section className="rounded-3xl border border-cyan-200 bg-cyan-50/60 p-6 shadow-sm">

          <h2 className="mb-5 text-xl font-black text-slate-900">
            Customer Balances
          </h2>

          {loading ? (
            <p className="text-slate-500">
              Loading...
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-slate-800">

                <thead>
                  <tr className="border-b border-gray-200 text-xs uppercase text-slate-500">
                    <th className="px-3 py-3">Order</th>
                    <th className="px-3 py-3">Customer</th>
                    <th className="px-3 py-3">Total</th>
                    <th className="px-3 py-3">Paid</th>
                    <th className="px-3 py-3">Balance</th>
                    <th className="px-3 py-3">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {unpaidOrders.map((order) => {

                    const fullyPaid = order.balance <= 0;

                    return (
                      <tr
                        key={order.id}
                        className="border-b border-gray-100"
                      >
                        <td className="px-3 py-4 font-bold">
                          {order.order_number}
                        </td>

                        <td className="px-3 py-4">
                          <div className="font-semibold">
                            {order.customer_name}
                          </div>

                          <div className="text-xs text-slate-500">
                            {order.customer_phone}
                          </div>
                        </td>

                        <td className="px-3 py-4">
                          {money(order.total)}
                        </td>

                        <td className="px-3 py-4 text-emerald-400">
                          {money(order.paid)}
                        </td>

                        <td className="px-3 py-4 font-black text-red-400">
                          {money(order.balance)}
                        </td>

                        <td className="px-3 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              fullyPaid
                                ? "bg-emerald-500/10 text-emerald-400"
                                : order.paid > 0
                                ? "bg-yellow-500/10 text-yellow-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {fullyPaid
                              ? "PAID"
                              : order.paid > 0
                              ? "PARTIAL"
                              : "UNPAID"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {!unpaidOrders.length && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-10 text-center text-slate-500"
                      >
                        No orders found.
                      </td>
                    </tr>
                  )}
                </tbody>

              </table>
            </div>
          )}

        </section>

      </div>
    </main>
  );
}
