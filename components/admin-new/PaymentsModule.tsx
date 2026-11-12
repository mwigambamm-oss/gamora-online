
"use client";

import { useEffect, useState } from "react";

type Payment = {
  id: number;
  order_number: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  proof?: string | null;
  created_at: string;
};

type Order = {
  id: number;
  order_number: string;
  customer_name: string;
  total: number;
  status?: string;
};

const money = (n: number) =>
  `TZS ${Number(n || 0).toLocaleString()}`;

export default function PaymentsModule() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderId, setOrderId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [proof, setProof] = useState("");
  const [edit, setEdit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedOrder = orders.find(
    (o) => String(o.id) === orderId
  );

  const previouslyPaid = selectedOrder
    ? payments
        .filter(
          (p) =>
            p.order_number === selectedOrder.order_number &&
            p.payment_status === "Paid"
        )
        .reduce((sum, p) => sum + Number(p.amount || 0), 0)
    : 0;

  const orderTotal = Number(selectedOrder?.total || 0);

  const remainingBalance = Math.max(
    orderTotal - previouslyPaid,
    0
  );

  async function load() {
    try {
      setLoading(true);

      const res = await fetch("/api/accounting/payments", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load payments");
      }

      setPayments(data.payments || []);
      setOrders(data.orders || []);
    } catch (e: any) {
      alert(e.message || "Failed to load payment records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleOrderChange(value: string) {
    setOrderId(value);

    const order = orders.find(
      (o) => String(o.id) === value
    );

    if (order) {
      const paid = payments
        .filter(
          (p) =>
            p.order_number === order.order_number &&
            p.payment_status === "Paid"
        )
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

      setAmount(
        String(Math.max(Number(order.total || 0) - paid, 0))
      );
    } else {
      setAmount("");
    }
  }

  async function save() {
    const numericAmount = Number(amount);

    if (!edit && !orderId) {
      alert("Please select an order.");
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }

    if (
      !edit &&
      numericAmount > remainingBalance
    ) {
      alert("Payment amount cannot exceed the remaining balance.");
      return;
    }

    try {
      setSaving(true);

      const body = edit
        ? {
            id: edit.id,
            amount: numericAmount,
            payment_method: method,
            payment_status: "Paid",
          }
        : {
            order_id: Number(orderId),
            amount: numericAmount,
            payment_method: method,
            payment_status: "Paid",
            proof,
          };

      const res = await fetch("/api/accounting/payments", {
        method: edit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save payment.");
      }

      alert(edit ? "Payment updated successfully." : "Payment recorded successfully.");

      setEdit(null);
      setAmount("");
      setProof("");
      setOrderId("");
      setMethod("Cash");

      await load();
    } catch (e: any) {
      alert(e.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete payment?")) return;

    try {
      const res = await fetch("/api/accounting/payments", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete payment.");
      }

      alert("Payment deleted successfully.");
      await load();
    } catch (e: any) {
      alert(e.message || "Failed to delete payment.");
    }
  }

  function printReceipt(payment: Payment) {
    const w = window.open("", "PRINT");

    if (!w) return;

    w.document.write(`
      <html>
      <head><title>Payment Receipt</title></head>
      <body style="font-family:Arial;padding:30px;">
        <h2>GAMORA ONLINE</h2>
        <h3>Payment Receipt</h3>
        <p>Order: ${payment.order_number}</p>
        <p>Amount: ${money(payment.amount)}</p>
        <p>Method: ${payment.payment_method}</p>
        <p>Date: ${new Date(payment.created_at).toLocaleString()}</p>
      </body>
      </html>
    `);

    w.document.close();
    w.print();
  }

  return (
    <section className="space-y-6">

      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs font-black text-[#172554]">
            GAMORA ONLINE
          </p>
          <h2 className="text-2xl font-black">
            Payments
          </h2>
        </div>

        <button
          onClick={load}
          className="rounded-xl bg-[#172554] px-5 py-3 text-white font-bold hover:bg-[#0F766E]"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="rounded-2xl bg-[#E2E8F0] border border-[#CBD5E1] p-6">

        <h3 className="font-black text-lg">
          {edit ? "Edit Payment" : "Record Payment"}
        </h3>

        <div className="grid md:grid-cols-2 gap-4 mt-4">

          {!edit && (
            <div>
              <label className="block text-sm font-bold mb-2">
                Select Order
              </label>

              <select
                className="w-full border rounded-xl p-3 bg-white"
                value={orderId}
                onChange={(e) => handleOrderChange(e.target.value)}
              >
                <option value="">Select Order</option>

                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.order_number} - {o.customer_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedOrder && !edit && (
            <div className="rounded-xl bg-white border p-3">
              <p className="text-xs text-slate-500">
                Order Total
              </p>
              <p className="font-black text-lg text-[#172554]">
                {money(orderTotal)}
              </p>
            </div>
          )}

          {selectedOrder && !edit && (
            <div className="rounded-xl bg-white border p-3">
              <p className="text-xs text-slate-500">
                Previously Paid
              </p>
              <p className="font-black text-lg text-[#0F766E]">
                {money(previouslyPaid)}
              </p>
            </div>
          )}

          {selectedOrder && !edit && (
            <div className="rounded-xl bg-white border border-orange-200 p-3">
              <p className="text-xs text-slate-500">
                Remaining Balance
              </p>
              <p className="font-black text-lg text-orange-700">
                {money(remainingBalance)}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold mb-2">
              Amount Paid (TZS)
            </label>

            <input
              className="w-full border rounded-xl p-3 bg-white"
              type="number"
              min="1"
              step="1"
              placeholder="Enter amount paid"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            {!edit && selectedOrder && (
              <p className="text-xs text-slate-500 mt-2">
                You can change this amount if the customer
                pays less than the order total.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">
              Payment Method
            </label>

            <select
              className="w-full border rounded-xl p-3 bg-white"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option>Cash</option>
              <option>M-Pesa</option>
              <option>Mix by Yas</option>
              <option>Airtel Money</option>
              <option>NMB Bank</option>
              <option>CRDB Bank</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">
              Payment Proof
            </label>

            <input
              className="w-full border rounded-xl p-3 bg-white"
              type="file"
              onChange={(e) =>
                setProof(e.target.files?.[0]?.name || "")
              }
            />
          </div>

        </div>

        <button
          onClick={save}
          disabled={saving || (!edit && !orderId)}
          className="mt-5 rounded-xl bg-[#0F766E] px-6 py-3 text-white font-bold hover:bg-[#115E59] disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : edit
            ? "Update Payment"
            : "Save Payment"}
        </button>

        {edit && (
          <button
            onClick={() => {
              setEdit(null);
              setAmount("");
              setMethod("Cash");
            }}
            className="ml-3 rounded-xl bg-slate-500 px-6 py-3 text-white font-bold"
          >
            Cancel
          </button>
        )}

      </div>

      <div className="bg-[#E2E8F0] border border-[#CBD5E1] rounded-2xl overflow-hidden">

        <div className="p-4 font-black">
          Payment Records
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">

            <thead>
              <tr className="border-b bg-[#F8FAF9]">
                <th className="p-4 text-left">Order</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Method</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>

            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b">

                  <td className="p-4 font-bold">
                    {p.order_number}
                  </td>

                  <td className="p-4">
                    {money(p.amount)}
                  </td>

                  <td className="p-4">
                    {p.payment_method}
                  </td>

                  <td className="p-4">
                    <div className="flex gap-2 flex-wrap">

                      <button
                        onClick={() => {
                          setEdit(p);
                          setAmount(String(p.amount));
                          setMethod(p.payment_method);
                          setOrderId("");
                        }}
                        className="bg-[#172554] text-white px-3 py-2 rounded-lg hover:bg-[#0F766E]"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => remove(p.id)}
                        className="bg-[#475569] text-white px-3 py-2 rounded-lg hover:bg-[#172554]"
                      >
                        Delete
                      </button>

                      <button
                        onClick={() => printReceipt(p)}
                        className="bg-[#172554] text-white px-3 py-2 rounded-lg hover:bg-[#0F766E]"
                      >
                        Receipt
                      </button>

                    </div>
                  </td>

                </tr>
              ))}

              {!loading && payments.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-500">
                    No payment records found.
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>

      </div>

    </section>
  );
}
