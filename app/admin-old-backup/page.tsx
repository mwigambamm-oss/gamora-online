"use client";

import { useEffect, useState } from "react";
import { getProducts } from "@/lib/products";
import { getOrders, type Order } from "@/lib/orders";

type Stat = {
  title: string;
  value: string;
  icon: string;
};

export default function AdminDashboard() {
  const [productsCount, setProductsCount] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customersCount, setCustomersCount] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
const [menuOpen, setMenuOpen] = useState(false);

  async function loadDashboard() {
    try {
      setLoading(true);

      const [products, loadedOrders] = await Promise.all([
        getProducts(),
        getOrders(),
      ]);

      setProductsCount(products.length);
      setOrders(loadedOrders);

      const customers = new Set(
        loadedOrders
          .map((order) => order.customer?.phone)
          .filter(Boolean)
      );

      setCustomersCount(customers.size);

      const totalRevenue = loadedOrders
        .filter((order) => order.status !== "Cancelled")
        .reduce(
          (sum, order) => sum + Number(order.total || 0),
          0
        );

      setRevenue(totalRevenue);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }

    window.location.href = "/admin/login";
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const now = new Date();

  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  const activeOrders = orders.filter(
    (order) => order.status !== "Cancelled"
  );

  const todayOrders = activeOrders.filter((order) => {
    const date = new Date(order.createdAt);
    return date >= todayStart;
  });

  const monthOrders = activeOrders.filter((order) => {
    const date = new Date(order.createdAt);
    return date >= monthStart;
  });

  const todaySales = todayOrders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const monthSales = monthOrders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const cancelledOrders = orders.filter(
    (order) => order.status === "Cancelled"
  );

  const cancelledValue = cancelledOrders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const deliveryFees = activeOrders.reduce(
    (sum, order) => sum + Number(order.deliveryFee || 0),
    0
  );

  const pendingOrders = orders.filter(
    (order) => order.status === "Pending"
  ).length;

  const processingOrders = orders.filter(
    (order) => order.status === "Processing"
  ).length;

  const deliveredOrders = orders.filter(
    (order) => order.status === "Delivered"
  ).length;

  const stats: Stat[] = [
    {
      title: "Total Products",
      value: String(productsCount),
      icon: "📦",
    },
    {
      title: "Total Orders",
      value: String(orders.length),
      icon: "🛍️",
    },
    {
      title: "Customers",
      value: String(customersCount),
      icon: "👥",
    },
    {
      title: "Revenue",
      value: `TZS ${revenue.toLocaleString()}`,
      icon: "💰",
    },
  ];

  const recentOrders = orders.slice(0, 5);

  return (
    <main className="min-h-screen bg-gray-100">

      <aside
  className={`fixed left-0 top-0 z-50 h-screen w-64 bg-gray-950 text-white transition-transform ${
    menuOpen ? "translate-x-0" : "-translate-x-full"
  } md:translate-x-0`}
>

 <button
    className="absolute right-4 top-4 rounded-lg bg-gray-800 px-3 py-2 text-white md:hidden"
    onClick={() => setMenuOpen(false)}
  >
    ✕
  </button>

        <div className="border-b border-gray-800 px-6 py-6">
          <h1 className="text-lg font-black text-orange-500">
            GAMORA
          </h1>

          <p className="text-xs font-semibold tracking-[0.3em] text-gray-500">
            ONLINE
          </p>

          <p className="mt-4 text-xs text-gray-400">
            ADMIN PANEL
          </p>
        </div>

        <nav className="p-4">

          <a
            href="/admin"
            className="mb-2 flex items-center gap-3 rounded-lg bg-orange-600 px-4 py-3 font-semibold"
          >
            📊 Dashboard
          </a>

          <a
            href="/admin/products"
            className="mb-2 flex items-center gap-3 rounded-lg px-4 py-3 text-gray-300 hover:bg-gray-800"
          >
            📦 Products
          </a>

          <a
            href="/admin/orders"
            className="mb-2 flex items-center gap-3 rounded-lg px-4 py-3 text-gray-300 hover:bg-gray-800"
          >
            🛍️ Orders
          </a>

          <a
            href="/admin/customers"
            className="mb-2 flex items-center gap-3 rounded-lg px-4 py-3 text-gray-300 hover:bg-gray-800"
          >
            👥 Customers
          </a>

          <a
            href="/admin/categories"
            className="mb-2 flex items-center gap-3 rounded-lg px-4 py-3 text-gray-300 hover:bg-gray-800"
          >
            🏷️ Categories
          </a>

          <a
            href="/admin/reports"
            className="mb-2 flex items-center gap-3 rounded-lg px-4 py-3 text-gray-300 hover:bg-gray-800"
          >
            📑 Reports
          </a>

          <a
            href="/admin/analytics"
            className="mb-2 flex items-center gap-3 rounded-lg px-4 py-3 text-gray-300 hover:bg-gray-800"
          >
            📈 Analytics
          </a>

          <a
            href="/admin/messages"
            className="mb-2 flex items-center gap-3 rounded-lg px-4 py-3 text-gray-300 hover:bg-gray-800"
          >
            💬 Messages
          </a>

          <a
            href="/admin/settings"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-300 hover:bg-gray-800"
          >
            ⚙️ Settings
          </a>

        </nav>

        <div className="absolute bottom-0 w-full border-t border-gray-800 p-4">

          <a
            href="/"
            className="mb-2 flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            ← View Store
          </a>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-red-400 hover:bg-red-950 hover:text-red-300"
          >
            🚪 Logout
          </button>

        </div>

      </aside>

      <section className="md:ml-64">

        <header className="border-b bg-white px-4 py-5 shadow-sm md:px-6">

  <button
    className="mb-4 rounded-lg bg-gray-950 px-4 py-3 text-white md:hidden"
    onClick={() => setMenuOpen(true)}
  >
    ☰ Menu
  </button>

  <div className="flex items-center justify-between gap-4">

            <div>
              <h2 className="text-lg font-black text-gray-900">
                Dashboard
              </h2>

              <p className="text-sm text-gray-500">
                GAMORA ONLINE administration panel
              </p>
            </div>

            <div className="flex items-center gap-3">

              <button
                type="button"
                onClick={loadDashboard}
                disabled={loading}
                className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-normal text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {loading ? "Loading..." : "🔄 Refresh"}
              </button>

              <div className="relative">

                <button
                  type="button"
                  onClick={() => setProfileOpen((value) => !value)}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm hover:shadow-md"
                >

                  <img
                    src="/admin-picture.jpeg"
                    alt="Admin"
                    className="h-10 w-10 rounded-full border-2 border-orange-500 object-cover"
                  />

                  <div className="hidden text-left sm:block">
                    <p className="text-xs font-black text-gray-900">
                      Admin
                    </p>

                    <p className="text-[10px] text-gray-500">
                      GAMORA ONLINE
                    </p>
                  </div>

                  <span className="text-xs text-gray-500">
                    {profileOpen ? "▲" : "▼"}
                  </span>

                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-14 z-50 w-56 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl">

                    <div className="border-b border-gray-100 px-3 py-3">

                      <div className="flex items-center gap-3">

                        <img
                          src="/admin-picture.jpeg"
                          alt="Admin"
                          className="h-12 w-12 rounded-full border-2 border-orange-500 object-cover"
                        />

                        <div>
                          <p className="text-xs font-medium text-gray-900">
                            Admin
                          </p>

                          <p className="text-xs text-gray-500">
                            Administrator
                          </p>
                        </div>

                      </div>

                    </div>

                    <a
                      href="/admin/change-password"
                      className="mt-2 flex items-center gap-3 rounded-xl px-3 py-3 text-xs font-normal text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                    >
                      🔐 Change Password
                    </a>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-normal text-red-600 hover:bg-red-50"
                    >
                      🚪 Logout
                    </button>

                  </div>
                )}

              </div>

            </div>

          </div>

        </header>

        <div className="p-4 md:p-6">

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {stats.map((stat) => (
              <div
                key={stat.title}
                className="rounded-2xl bg-white p-5 shadow-sm"
              >

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-sm font-semibold text-gray-500">
                      {stat.title}
                    </p>

                    <p className="mt-2 text-lg font-black text-gray-900">
                      {stat.value}
                    </p>
                  </div>

                  <div className="text-xl">
                    {stat.icon}
                  </div>

                </div>

              </div>
            ))}

          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-xs font-normal text-gray-500">
                Today's Sales
              </p>

              <p className="mt-2 text-lg font-black text-emerald-600">
                TZS {todaySales.toLocaleString()}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {todayOrders.length} orders today
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-xs font-normal text-gray-500">
                This Month
              </p>

              <p className="mt-2 text-lg font-black text-blue-600">
                TZS {monthSales.toLocaleString()}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {monthOrders.length} orders this month
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-xs font-normal text-gray-500">
                Delivery Fees
              </p>

              <p className="mt-2 text-lg font-black text-orange-600">
                TZS {deliveryFees.toLocaleString()}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                From active orders
              </p>
            </div>

          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-xs font-normal text-gray-500">
                Pending
              </p>

              <p className="mt-2 text-lg font-black text-amber-600">
                {pendingOrders}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-xs font-normal text-gray-500">
                Processing
              </p>

              <p className="mt-2 text-lg font-black text-blue-600">
                {processingOrders}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-xs font-normal text-gray-500">
                Delivered
              </p>

              <p className="mt-2 text-lg font-black text-emerald-600">
                {deliveredOrders}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-xs font-normal text-gray-500">
                Cancelled Value
              </p>

              <p className="mt-2 text-base font-medium text-red-600">
                TZS {cancelledValue.toLocaleString()}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {cancelledOrders.length} cancelled orders
              </p>
            </div>

          </div>

          <div className="mt-6 rounded-2xl bg-white shadow-sm">

            <div className="flex items-center justify-between border-b px-5 py-5">

              <div>
                <h3 className="text-lg font-black text-gray-900">
                  Recent Orders
                </h3>

                <p className="text-sm text-gray-500">
                  Latest customer orders
                </p>
              </div>

              <a
                href="/admin/orders"
                className="rounded-lg bg-orange-600 px-4 py-2 text-xs font-normal text-white hover:bg-orange-700"
              >
                View All
              </a>

            </div>

            <div className="overflow-x-auto">

              {recentOrders.length === 0 ? (

                <div className="px-5 py-6 text-center">

                  <div className="text-4xl">
                    🛍️
                  </div>

                  <p className="mt-3 font-bold text-gray-700">
                    No orders yet
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    New customer orders will appear here.
                  </p>

                </div>

              ) : (

                <table className="w-full text-left">

                  <thead>
                    <tr className="border-b bg-gray-50 text-xs font-black uppercase text-gray-500">

                      <th className="px-5 py-4">
                        Order
                      </th>

                      <th className="px-5 py-4">
                        Customer
                      </th>

                      <th className="px-5 py-4">
                        Total
                      </th>

                      <th className="px-5 py-4">
                        Status
                      </th>

                    </tr>
                  </thead>

                  <tbody>

                    {recentOrders.map((order) => (

                      <tr
                        key={order.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >

                        <td className="px-5 py-4 font-bold text-gray-900">
                          #{order.id}
                        </td>

                        <td className="px-5 py-4">

                          <p className="font-semibold text-gray-900">
                            {order.customer?.name || "Customer"}
                          </p>

                          <p className="text-xs text-gray-500">
                            {order.customer?.phone || ""}
                          </p>

                        </td>

                        <td className="px-5 py-4 font-black text-gray-900">
                          TZS {Number(order.total || 0).toLocaleString()}
                        </td>

                        <td className="px-5 py-4">

                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
                            {order.status}
                          </span>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              )}

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}
