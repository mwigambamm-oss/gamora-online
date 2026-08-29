"use client";

import { useEffect, useMemo, useState } from "react";

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

export default function PaymentsModule() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orderId, setOrderId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setLoading(true);

      const response = await fetch(
        "/api/accounting/payments",
        { cache: "no-store" }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Failed to load payments"
        );
      }

      setOrders(result.orders || []);
      setPayments(result.payments || []);
    } catch (error) {
      console.error("Payments error:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const paidByOrder = useMemo(() => {
    const map = new Map<string, number>();

    payments
      .filter((p) => p.payment_status === "Paid")
      .forEach((p) => {
        map.set(
          p.order_number,
          (map.get(p.order_number) || 0) +
            Number(p.amount || 0)
        );
      });

    return map;
  }, [payments]);

  const outstandingOrders = orders
    .map((order) => {
      const paid =
        paidByOrder.get(order.order_number) || 0;

      return {
        ...order,
        paid,
        balance: Math.max(
          Number(order.total || 0) - paid,
          0
        ),
      };
    })
    .filter((order) => order.balance > 0);

  const totalPaid = payments
    .filter((p) => p.payment_status === "Paid")
    .reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0
    );

  const totalOutstanding = outstandingOrders.reduce(
    (sum, order) => sum + order.balance,
    0
  );

  async function recordPayment() {
    if (!orderId || !amount || Number(amount) <= 0) {
      alert("Select an order and enter a valid amount.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        "/api/accounting/payments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            order_id: Number(orderId),
            amount: Number(amount),
            payment_method: method,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Payment failed"
        );
      }

      setOrderId("");
      setAmount("");
      setMethod("Cash");

      await load();

      alert("✅ Payment recorded successfully.");
    } catch (error: any) {
      alert(error.message || "Failed to record payment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#800020]">
            GAMORA ONLINE
          </p>
          <h2 className="mt-1 text-2xl font-black text-[#3F3437]">
            Payments
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Record payments and monitor outstanding customer balances.
          </p>
        </div>

        <button
          onClick={load}
          className="rounded-xl bg-[#800020] px-5 py-3 text-sm font-bold text-white hover:bg-[#6b001b]"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm text-slate-500">Paid</p>
          <p className="mt-2 text-2xl font-black text-emerald-700">
            {money(totalPaid)}
          </p>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
          <p className="text-sm text-slate-500">Outstanding</p>
          <p className="mt-2 text-2xl font-black text-rose-700">
            {money(totalOutstanding)}
          </p>
        </div>

        <div className="rounded-2xl border border-[#E8DEE1] bg-white p-5">
          <p className="text-sm text-slate-500">
            Transactions
          </p>
          <p className="mt-2 text-3xl font-black">
            {loading ? "..." : payments.length}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#E8DEE1] bg-white p-6 shadow-sm">
        <h3 className="text-lg font-black">
          Record Customer Payment
        </h3>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <select
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="rounded-xl border border-[#E8DEE1] bg-white px-4 py-3 outline-none focus:border-[#800020]"
          >
            <option value="">Select Order</option>

            {outstandingOrders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.order_number} — {order.customer_name} —{" "}
                {money(order.balance)}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Payment amount"
            className="rounded-xl border border-[#E8DEE1] px-4 py-3 outline-none focus:border-[#800020]"
          />

          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="rounded-xl border border-[#E8DEE1] px-4 py-3 outline-none"
          >
            <option>Cash</option>
            <option>M-Pesa</option>
            <option>Mix by Yas</option>
            <option>Airtel Money</option>
            <option>NMB Bank</option>
            <option>CRDB Bank</option>
            <option>Bank Transfer</option>
          </select>
        </div>

        <button
          onClick={recordPayment}
          disabled={saving}
          className="mt-4 rounded-xl bg-[#800020] px-6 py-3 font-black text-white hover:bg-[#6b001b] disabled:bg-slate-300"
        >
          {saving ? "Recording..." : "💰 Record Payment"}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E8DEE1] bg-white shadow-sm">
        <div className="border-b p-5">
          <h3 className="font-black">
            Payment Transactions
          </h3>
        </div>

        {payments.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No payment transactions yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-sm">
                  <th className="px-5 py-4">Order</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Method</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Date</th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b last:border-0"
                  >
                    <td className="px-5 py-4 font-bold">
                      {payment.order_number}
                    </td>
                    <td className="px-5 py-4 font-black">
                      {money(payment.amount)}
                    </td>
                    <td className="px-5 py-4">
                      {payment.payment_method}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                        {payment.payment_status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">
                      {new Date(payment.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
