"use client";

import { useEffect, useMemo, useState } from "react";

type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

type Order = {
  id: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
    notes: string;
  };
  location: {
    latitude: number;
    longitude: number;
  } | null;
  distanceKm: number | null;
  deliveryFee: number;
  items: CartItem[];
  subtotal: number;
  total: number;
  status: string;
  createdAt: string;
};

const STATUS_OPTIONS = [
  "Pending",
  "Confirmed",
  "Processing",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

const emptyStats = [
  {
    title: "Total Products",
    value: "0",
    icon: "📦",
    change: "Live",
  },
  {
    title: "Total Orders",
    value: "0",
    icon: "🛍️",
    change: "Live",
  },
  {
    title: "Customers",
    value: "0",
    icon: "👥",
    change: "Live",
  },
  {
    title: "Revenue",
    value: "TZS 0",
    icon: "💰",
    change: "Live",
  },
];

export default function AdminDashboard() {
  const [productsCount, setProductsCount] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customersCount, setCustomersCount] = useState(0);
  const [revenue, setRevenue] = useState(0);

  useEffect(() => {
    try {
      const savedProducts = localStorage.getItem("gamora_products");
      const savedOrders = localStorage.getItem("gamora_orders");

      const products = savedProducts ? JSON.parse(savedProducts) : [];
      const loadedOrders = savedOrders ? JSON.parse(savedOrders) : [];

      setProductsCount(Array.isArray(products) ? products.length : 0);
      setOrders(Array.isArray(loadedOrders) ? loadedOrders : []);

      const customers = new Set(
        Array.isArray(loadedOrders)
          ? loadedOrders.map((order: Order) => order.customer?.phone).filter(Boolean)
          : []
      );

      setCustomersCount(customers.size);

      const totalRevenue = Array.isArray(loadedOrders)
        ? loadedOrders
            .filter((order: Order) => order.status !== "Cancelled")
            .reduce(
              (sum: number, order: Order) => sum + Number(order.total || 0),
              0
            )
        : 0;

      setRevenue(totalRevenue);
    } catch (error) {
      console.error("Failed to load admin dashboard data:", error);
    }
  }, []);

  const stats = [
    {
      title: "Total Products",
      value: String(productsCount),
      icon: "📦",
      change: "Live",
    },
    {
      title: "Total Orders",
      value: String(orders.length),
      icon: "🛍️",
      change: "Live",
    },
    {
      title: "Customers",
      value: String(customersCount),
      icon: "👥",
      change: "Live",
    },
    {
      title: "Revenue",
      value: `TZS ${revenue.toLocaleString()}`,
      icon: "💰",
      change: "Live",
    },
  ];

  const recentOrders = orders.slice(0, 5).map((order) => ({
    id: order.id,
    customer: order.customer?.name || "Unknown",
    amount: `TZS ${Number(order.total || 0).toLocaleString()}`,
    status: order.status || "Pending",
  }));

  return (
    <main className="min-h-screen bg-gray-100">

      {/* SIDEBAR */}

      <aside className="fixed left-0 top-0 hidden h-screen w-64 bg-gray-950 text-white md:block">

        <div className="border-b border-gray-800 px-6 py-6">

          <h1 className="text-2xl font-black text-orange-500">
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
            href="#products"
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
            href="/admin/settings"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-300 hover:bg-gray-800"
          >
            ⚙️ Settings
          </a>

        </nav>

        <div className="absolute bottom-0 w-full border-t border-gray-800 p-4">

          <a
            href="/"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            ← View Store
          </a>

        </div>

      </aside>

      {/* MAIN CONTENT */}

      <section className="md:ml-64">

        {/* TOP HEADER */}

        <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-white px-4 py-4 shadow-sm md:px-8">

          <div>

            <h2 className="text-xl font-bold text-gray-900">
              Dashboard
            </h2>

            <p className="text-sm text-gray-500">
              Welcome back, Admin
            </p>

          </div>

          <div className="flex items-center gap-3">

            <button className="rounded-lg border px-3 py-2 hover:bg-gray-100">
              🔔
            </button>

            <div className="hidden text-right sm:block">

              <p className="text-sm font-bold">
                Administrator
              </p>

              <p className="text-xs text-gray-500">
                Admin
              </p>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-600 font-bold text-white">
              A
            </div>

          </div>

        </header>

        {/* CONTENT */}

        <div className="p-4 md:p-8">

          {/* QUICK ACTIONS */}

          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

            <div>

              <h3 className="text-2xl font-black text-gray-900">
                Overview
              </h3>

              <p className="text-sm text-gray-500">
                Monitor your online store
              </p>

            </div>

            <a
              href="/admin/products"
              className="rounded-lg bg-orange-600 px-6 py-3 text-center font-bold text-white shadow-sm hover:bg-orange-700"
            >
              + Add Product
            </a>

          </div>

          {/* STATS */}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {stats.map((stat) => (

              <div
                key={stat.title}
                className="rounded-xl bg-white p-5 shadow-sm"
              >

                <div className="flex items-start justify-between">

                  <div>

                    <p className="text-sm font-medium text-gray-500">
                      {stat.title}
                    </p>

                    <h3 className="mt-2 text-2xl font-black text-gray-900">
                      {stat.value}
                    </h3>

                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 text-2xl">
                    {stat.icon}
                  </div>

                </div>

                <p className="mt-4 text-sm font-semibold text-green-600">
                  ↑ {stat.change} this month
                </p>

              </div>

            ))}

          </div>

          {/* PRODUCTS / QUICK MANAGEMENT */}

          <div
            id="products"
            className="mt-8 rounded-xl bg-white p-5 shadow-sm"
          >

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

              <div>

                <h3 className="text-xl font-black">
                  Product Management
                </h3>

                <p className="text-sm text-gray-500">
                  Manage products in your store
                </p>

              </div>

              <a href="/admin/products" className="rounded-lg border border-orange-600 px-5 py-2 font-semibold text-orange-600 hover:bg-orange-50">
                View All Products
              </a>

            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">

              <div className="rounded-lg border p-5">

                <div className="text-3xl">
                  ➕
                </div>

                <h4 className="mt-3 font-bold">
                  Add Product
                </h4>

                <p className="mt-1 text-sm text-gray-500">
                  Add new products to your marketplace.
                </p>

                <a href="/admin/products" className="mt-4 inline-block rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
                  Add Product
                </a>

              </div>

              <div className="rounded-lg border p-5">

                <div className="text-3xl">
                  ✏️
                </div>

                <h4 className="mt-3 font-bold">
                  Edit Products
                </h4>

                <p className="mt-1 text-sm text-gray-500">
                  Update prices, stock and details.
                </p>

                <a href="/admin/products" className="mt-4 inline-block rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
                  Manage Products
                </a>

              </div>

              <div className="rounded-lg border p-5">

                <div className="text-3xl">
                  📦
                </div>

                <h4 className="mt-3 font-bold">
                  Stock Management
                </h4>

                <p className="mt-1 text-sm text-gray-500">
                  Monitor available product stock.
                </p>

                <a href="/admin/products" className="mt-4 inline-block rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
                  View Stock
                </a>

              </div>

            </div>

          </div>

          {/* RECENT ORDERS */}

          <div
            id="orders"
            className="mt-8 rounded-xl bg-white p-5 shadow-sm"
          >

            <div className="mb-5 flex items-center justify-between">

              <div>

                <h3 className="text-xl font-black">
                  Recent Orders
                </h3>

                <p className="text-sm text-gray-500">
                  Latest customer orders
                </p>

              </div>

              <button className="font-semibold text-orange-600">
                View All →
              </button>

            </div>

            <div className="overflow-x-auto">

              <table className="w-full min-w-[600px] text-left">

                <thead>

                  <tr className="border-b text-sm text-gray-500">

                    <th className="px-4 py-3">
                      Order
                    </th>

                    <th className="px-4 py-3">
                      Customer
                    </th>

                    <th className="px-4 py-3">
                      Amount
                    </th>

                    <th className="px-4 py-3">
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

                      <td className="px-4 py-4 font-semibold">
                        {order.id}
                      </td>

                      <td className="px-4 py-4">
                        {order.customer}
                      </td>

                      <td className="px-4 py-4 font-bold">
                        {order.amount}
                      </td>

                      <td className="px-4 py-4">

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            order.status === "Completed"
                              ? "bg-green-100 text-green-700"
                              : order.status === "Processing"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {order.status}
                        </span>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </div>

          {/* STORE LINK */}

          <div className="mt-8 rounded-xl bg-gradient-to-r from-orange-600 to-yellow-500 p-6 text-white">

            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

              <div>

                <h3 className="text-xl font-black">
                  GAMORA ONLINE Store
                </h3>

                <p className="text-sm text-white/80">
                  Your marketplace is ready for the next step.
                </p>

              </div>

              <a
                href="/"
                className="rounded-lg bg-gray-900 px-6 py-3 text-center font-bold"
              >
                View Store →
              </a>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}
