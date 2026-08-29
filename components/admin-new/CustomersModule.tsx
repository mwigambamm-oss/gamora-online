"use client";

import { useEffect, useMemo, useState } from "react";
import { getOrders, type Order } from "@/lib/orders";

type Customer = {
  key: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  orders: number;
  spent: number;
};

const money = (n: number) => `TZS ${Number(n || 0).toLocaleString()}`;

export default function CustomersModule() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);

  async function load() {
    try {
      setLoading(true);
      setOrders(await getOrders());
    } catch (error) {
      console.error("Customers error:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const customers = useMemo(() => {
    const map = new Map<string, Customer>();

    orders.forEach((order) => {
      const c = order.customer;
      const key =
        c?.phone ||
        c?.email ||
        `${c?.name || "Unknown"}-${order.id}`;

      const existing = map.get(key);

      if (existing) {
        existing.orders += 1;
        if (order.status !== "Cancelled") {
          existing.spent += Number(order.total || 0);
        }
      } else {
        map.set(key, {
          key,
          name: c?.name || "Unknown Customer",
          phone: c?.phone || "-",
          email: c?.email || "-",
          address: c?.address || "-",
          orders: 1,
          spent:
            order.status !== "Cancelled"
              ? Number(order.total || 0)
              : 0,
        });
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => b.spent - a.spent
    );
  }, [orders]);

  const filtered = customers.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;

    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q)
    );
  });

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#800020]">
            GAMORA ONLINE
          </p>
          <h2 className="mt-1 text-2xl font-black text-[#3F3437]">
            Customers
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage and review customers generated from real orders.
          </p>
        </div>

        <button
          onClick={load}
          className="rounded-xl bg-[#800020] px-5 py-3 text-sm font-bold text-white hover:bg-[#6b001b]"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#E8DEE1] bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Customers</p>
          <p className="mt-2 text-3xl font-black">
            {loading ? "..." : customers.length}
          </p>
        </div>

        <div className="rounded-2xl border border-[#E8DEE1] bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Orders</p>
          <p className="mt-2 text-3xl font-black">
            {loading ? "..." : orders.length}
          </p>
        </div>

        <div className="rounded-2xl border border-[#E8DEE1] bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Customer Sales</p>
          <p className="mt-2 text-xl font-black">
            {loading
              ? "..."
              : money(
                  customers.reduce(
                    (sum, c) => sum + c.spent,
                    0
                  )
                )}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E8DEE1] bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b p-5 md:flex-row md:items-center">
          <div>
            <h3 className="font-black">Customer List</h3>
            <p className="text-sm text-slate-500">
              {filtered.length} customer(s)
            </p>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone or email..."
            className="w-full rounded-xl border border-[#E8DEE1] px-4 py-3 text-sm outline-none focus:border-[#800020] md:w-80"
          />
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            ⏳ Loading customers...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl">👥</div>
            <p className="mt-3 font-bold">No customers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-sm">
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Phone</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Orders</th>
                  <th className="px-5 py-4">Spent</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((customer) => (
                  <tr
                    key={customer.key}
                    className="border-b last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 font-bold">
                      {customer.name}
                    </td>
                    <td className="px-5 py-4 text-sm">
                      {customer.phone}
                    </td>
                    <td className="px-5 py-4 text-sm">
                      {customer.email}
                    </td>
                    <td className="px-5 py-4 font-bold">
                      {customer.orders}
                    </td>
                    <td className="px-5 py-4 font-bold">
                      {money(customer.spent)}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setSelected(customer)}
                        className="rounded-lg bg-[#F8EDEF] px-3 py-2 text-xs font-bold text-[#800020] hover:bg-[#f1dfe4]"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="rounded-2xl border border-[#E8DEE1] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black">
                {selected.name}
              </h3>
              <p className="text-sm text-slate-500">
                Customer details
              </p>
            </div>

            <button
              onClick={() => setSelected(null)}
              className="rounded-lg border px-3 py-2 text-sm font-bold"
            >
              Close
            </button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">
                Phone
              </p>
              <p className="mt-1 font-semibold">
                {selected.phone}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase text-slate-400">
                Email
              </p>
              <p className="mt-1 font-semibold">
                {selected.email}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase text-slate-400">
                Address
              </p>
              <p className="mt-1 font-semibold">
                {selected.address}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase text-slate-400">
                Total Spent
              </p>
              <p className="mt-1 font-black text-[#800020]">
                {money(selected.spent)}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
