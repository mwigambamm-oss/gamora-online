"use client";

import { useEffect, useMemo, useState } from "react";
import { getOrders, type Order } from "@/lib/orders";

type CustomerSummary = {
  key: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  ordersCount: number;
  totalSpent: number;
};

export default function CustomersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerSummary | null>(null);

  async function loadCustomers() {
    try {
      setLoading(true);
      const data = await getOrders();
      setOrders(data);
    } catch (error) {
      console.error("Failed to load customers:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  const customers = useMemo(() => {
    const customerMap = new Map<string, CustomerSummary>();

    orders.forEach((order) => {
      const customer = order.customer;
      const key =
        customer?.phone ||
        customer?.email ||
        `${customer?.name}-${order.id}`;

      const existing = customerMap.get(key);

      if (existing) {
        existing.ordersCount += 1;

        if (order.status !== "Cancelled") {
          existing.totalSpent += Number(order.total || 0);
        }
      } else {
        customerMap.set(key, {
          key,
          name: customer?.name || "Unknown Customer",
          phone: customer?.phone || "-",
          email: customer?.email || "-",
          address: customer?.address || "-",
          ordersCount: 1,
          totalSpent:
            order.status !== "Cancelled"
              ? Number(order.total || 0)
              : 0,
        });
      }
    });

    return Array.from(customerMap.values()).sort(
      (a, b) => b.totalSpent - a.totalSpent
    );
  }, [orders]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return customers;

    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(query) ||
        customer.phone.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.address.toLowerCase().includes(query)
    );
  }, [customers, search]);

  const selectedCustomerOrders = selectedCustomer
    ? orders.filter((order) => {
        const key =
          order.customer?.phone ||
          order.customer?.email ||
          `${order.customer?.name}-${order.id}`;

        return key === selectedCustomer.key;
      })
    : [];

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="border-b bg-white px-6 py-5 shadow-sm">
        <div className="mx-auto max-w-7xl">
          <a href="/admin" className="font-bold text-orange-600">
            ← Back to Dashboard
          </a>

          <div className="mt-3 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black">Customers</h1>

              <p className="text-sm text-gray-500">
                Customers from your GAMORA ONLINE orders
              </p>
            </div>

            <button
              onClick={loadCustomers}
              className="rounded-lg border px-4 py-2 font-bold hover:bg-gray-50"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Customers</p>
            <p className="mt-2 text-3xl font-black">
              {loading ? "..." : customers.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="mt-2 text-3xl font-black">
              {loading ? "..." : orders.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Active Customers</p>
            <p className="mt-2 text-3xl font-black text-green-600">
              {loading
                ? "..."
                : customers.filter(
                    (customer) => customer.ordersCount > 0
                  ).length}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b p-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

              <div>
                <h2 className="text-xl font-black">
                  Customer List
                </h2>

                <p className="text-sm text-gray-500">
                  Customer information is generated from orders.
                </p>
              </div>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, phone or email..."
                className="rounded-lg border px-4 py-2 text-sm outline-none focus:border-orange-500"
              />

            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="text-4xl">⏳</div>
              <p className="mt-3 text-sm text-gray-500">
                Loading customers...
              </p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl">👥</div>

              <h3 className="mt-4 text-lg font-bold">
                No customers yet
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Customers will appear here after placing orders.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-sm">
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Orders</th>
                    <th className="px-6 py-4">Total Spent</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCustomers.map((customer, index) => (
                    <tr
                      key={customer.key}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-600">
                            {index + 1}
                          </div>

                          <div>
                            <p className="font-bold">
                              {customer.name}
                            </p>

                            <p className="text-xs text-gray-500">
                              {customer.address}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {customer.phone}
                      </td>

                      <td className="px-6 py-4">
                        {customer.email}
                      </td>

                      <td className="px-6 py-4 font-bold">
                        {customer.ordersCount}
                      </td>

                      <td className="px-6 py-4 font-black text-green-600">
                        TZS {customer.totalSpent.toLocaleString()}
                      </td>

                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            setSelectedCustomer(customer)
                          }
                          className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-bold text-white"
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
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b p-6">
              <div>
                <h2 className="text-xl font-black">
                  Customer Details
                </h2>

                <p className="text-sm text-gray-500">
                  {selectedCustomer.name}
                </p>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="rounded-lg border px-3 py-2 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 p-6">

              <section className="rounded-xl bg-gray-50 p-5">
                <h3 className="mb-4 font-black">
                  Customer Information
                </h3>

                <div className="grid gap-3 sm:grid-cols-2">
                  <p>
                    <strong>Name:</strong>{" "}
                    {selectedCustomer.name}
                  </p>

                  <p>
                    <strong>Phone:</strong>{" "}
                    {selectedCustomer.phone}
                  </p>

                  <p>
                    <strong>Email:</strong>{" "}
                    {selectedCustomer.email}
                  </p>

                  <p>
                    <strong>Address:</strong>{" "}
                    {selectedCustomer.address}
                  </p>
                </div>
              </section>

              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-black">
                    Order History
                  </h3>

                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                    {selectedCustomerOrders.length} Orders
                  </span>
                </div>

                <div className="overflow-hidden rounded-xl border">
                  {selectedCustomerOrders.map((order) => (
                    <div
                      key={order.id}
                      className="border-b p-4 last:border-0"
                    >
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

                        <div>
                          <p className="font-bold">
                            {order.id}
                          </p>

                          <p className="text-xs text-gray-500">
                            {order.createdAt
                              ? new Date(
                                  order.createdAt
                                ).toLocaleString()
                              : "-"}
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <p className="font-black">
                            TZS{" "}
                            {Number(
                              order.total || 0
                            ).toLocaleString()}
                          </p>

                          <span className="text-xs font-bold text-gray-500">
                            {order.status}
                          </span>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-xl bg-gray-950 p-5 text-white">
                <div className="flex justify-between">
                  <span>Total Spent</span>

                  <span className="font-black">
                    TZS{" "}
                    {selectedCustomer.totalSpent.toLocaleString()}
                  </span>
                </div>

                <div className="mt-3 flex justify-between border-t border-gray-700 pt-3">
                  <span>Total Orders</span>

                  <span className="font-black">
                    {selectedCustomer.ordersCount}
                  </span>
                </div>
              </section>

            </div>
          </div>
        </div>
      )}
    </main>
  );
}
