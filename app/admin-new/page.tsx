"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { updateProduct } from "@/lib/products";

const OrdersModule = dynamic(() => import("@/components/admin-new/OrdersModule"));
const SettingsModule = dynamic(() => import("@/components/admin-new/SettingsModule"));
const AuditLogModule = dynamic(() => import("@/components/admin-new/AuditLogModule"));
const AdminUsersModule = dynamic(() => import("@/components/admin-new/AdminUsersModule"));
const NotificationsModule = dynamic(() => import("@/components/admin-new/NotificationsModule"));
const ReviewsModule = dynamic(() => import("@/components/admin-new/ReviewsModule"));
const ReportsModule = dynamic(() => import("@/components/admin-new/ReportsModule"));
const AccountingModule = dynamic(() => import("@/components/admin-new/AccountingModule"));
const PaymentsModule = dynamic(() => import("@/components/admin-new/PaymentsModule"));
const CustomersModule = dynamic(() => import("@/components/admin-new/CustomersModule"));
const InventoryModule = dynamic(() => import("@/components/admin-new/InventoryModule"));
const ProductsModule = dynamic(() => import("@/components/admin-new/ProductsModule"));
const SalesChart = dynamic(() => import("@/components/admin-new/dashboard/SalesChart"));
const TopProducts = dynamic(() => import("@/components/admin-new/dashboard/TopProducts"));
const NotificationBell = dynamic(() => import("@/components/admin-new/dashboard/NotificationBell"));
const MessagesModule = dynamic(() => import("@/components/admin-new/MessagesModule"));

type DashboardData = {
  orders?: any[];
  orderItems?: any[];
  products?: any[];
  payments?: any[];
  expenses?: any[];

  summary: {
    orders: number;
    revenue: number;
    cogs: number;
    grossProfit: number;
    expenses: number;
    netProfit: number;
    pendingOrders: number;
    pendingPayments: number;
    lowStock: number;
    outOfStock: number;
    products: number;
  };
};

const menu = [
  "Dashboard",
  "Orders",
  "Products",
  "Inventory",
  "Customers",
  "Messages",
  "Payments",
  "Accounting",
  "Reports",
  "Notifications",
  "Admin Users",
  "Audit Log",
  "Settings",
];

export default function NewAdminPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [active, setActive] = useState("Dashboard");
  const [activeLoaded, setActiveLoaded] = useState(false);

  useEffect(() => {
    const savedTab = localStorage.getItem("gamora_admin_active_tab");

    if (savedTab) {
      setActive(savedTab);
    }

    setActiveLoaded(true);
  }, []);

  useEffect(() => {
    if (!activeLoaded) return;

    localStorage.setItem("gamora_admin_active_tab", active);
  }, [active, activeLoaded]);
const [period, setPeriod] = useState("Today");
const [fromDate, setFromDate] = useState("");
const [toDate, setToDate] = useState("");

  useEffect(() => {
    async function loadAdmin() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        setAdminEmail(user.email);
      }
    }

    loadAdmin();
  }, []);

  useEffect(() => {
  import("@/lib/supabase").then(({ supabase }) => {
    supabase.auth.getUser().then(({ data }) => {
      setAdminEmail(data.user?.email || "");
    });
  });

  if (period === "Custom Range") {
    if (fromDate && toDate) {
      loadDashboard();
    }
    return;
  }

  loadDashboard();
}, [period, fromDate, toDate]);

  async function loadDashboard() {
    try {
      const params = new URLSearchParams();

params.set("period", period);

if (period === "Custom Range") {
  params.set("from", fromDate);
  params.set("to", toDate);
}

const response = await fetch(
  `/api/admin/dashboard?${params.toString()}`
);

      if (!response.ok) {
        throw new Error("Failed to load dashboard");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load dashboard");
      }

      setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const money = (value: number) =>
    `TZS ${Number(value || 0).toLocaleString()}`;

  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [updatingStockId, setUpdatingStockId] = useState<number | null>(null);

  async function handleLowStockUpdate(product: any, value: string) {
    const stock = Number(value);

    if (!Number.isFinite(stock) || stock < 0) return;

    try {
      setUpdatingStockId(Number(product.id));

      const updated = await updateProduct(Number(product.id), { stock });

      setData((current) => {
        if (!current) return current;

        return {
          ...current,
          products: (current.products || []).map((item: any) =>
            Number(item.id) === Number(updated.id) ? updated : item
          ),
        };
      });
    } catch (error) {
      console.error("Failed to update stock:", error);
      alert("Failed to update stock.");
    } finally {
      setUpdatingStockId(null);
    }
  }

  const cards = data
    ? [
        {
          title: "Revenue",
          value: money(data.summary.revenue),
          icon: "💰",
        },
        {
          title: "COGS",
          value: money(data.summary.cogs),
          icon: "📦",
        },
        {
          title: "Gross Profit",
          value: money(data.summary.grossProfit),
          icon: "📈",
        },
        {
          title: "Expenses",
          value: money(data.summary.expenses),
          icon: "💸",
        },
        {
          title: "Net Profit",
          value: money(data.summary.netProfit),
          icon: "💵",
        },
        {
          title: "Orders",
          value: data.summary.orders.toLocaleString(),
          icon: "🛒",
        },
        {
          title: "Pending Orders",
          value: data.summary.pendingOrders.toLocaleString(),
          icon: "⏳",
        },
        {
          title: "Pending Payments",
          value: data.summary.pendingPayments.toLocaleString(),
          icon: "💳",
        },
        {
          title: "Low Stock",
          value: data.summary.lowStock.toLocaleString(),
          icon: "⚠️",
        },
        {
          title: "Out of Stock",
          value: data.summary.outOfStock.toLocaleString(),
          icon: "🚫",
        },
      ]
    : [];

return (
  <div className="min-h-screen bg-[#F8F6F6] text-[#3F3437]">
    <div className="flex min-h-screen">

        {/* SIDEBAR */}
<aside className="flex w-72 flex-col border-r border-[#E8DEE1] bg-white text-[#3F3437] shadow-sm">

          <div className="border-b border-[#E8DEE1] p-6">
            <div className="text-base font-medium">
              GAMORA
            </div>

            <div className="mt-1 text-xs font-medium text-slate-400">
              BUSINESS CONTROL CENTER
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">
              Main Menu
            </div>

            <nav className="space-y-1">
              {menu.map((item) => (
                <button
                  key={item}
                  onClick={() => setActive(item)}
                  className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                    active === item
                      ? "bg-[#800020] text-white"
: "text-[#3F3437] hover:bg-[#F8EDEF] hover:text-[#800020]"

                  }`}
                >
                  <span>{item}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="border-t border-[#E8DEE1] p-4">
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/admin-new/login";
              }}
              className="w-full rounded-xl bg-red-600 px-4 py-3 text-xs font-normal text-white hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main className="flex-1">

          {/* TOP BAR */}
          <header className="border-b bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Business Control Center
                </p>

                <h1 className="text-base font-medium">
                  {active}
                </h1>
              </div>

              <div className="flex items-center gap-3">

                <div className="hidden text-right sm:block">
                  <div className="text-xs font-normal">
                    {adminEmail || "Administrator"}
                  </div>

                  <div className="text-xs text-slate-500">
                    Super Admin
                  </div>
                </div>

<div className="h-20 w-20 overflow-hidden rounded-full border-2 border-[#800020] bg-white">
  <img
    src="/admin-picture.jpeg"
    alt="Administrator"
    className="h-full w-full object-contain"
  />
</div>
              </div>

              {data && (
                <NotificationBell
                  pendingOrders={data.summary.pendingOrders}
                  pendingPayments={data.summary.pendingPayments}
                  lowStock={data.summary.lowStock}
                />
              )}

            </div>
          </header>

          {/* CONTENT */}
          <div className="p-4 md:p-5">

            {active === "Orders" ? (
              <OrdersModule />
            ) : active === "Products" ? (
              <ProductsModule />
            ) : active === "Inventory" ? (
              <InventoryModule />
            ) : active === "Customers" ? (
              <CustomersModule />
            ) : active === "Messages" ? (
              <MessagesModule />
            ) : active === "Payments" ? (
              <PaymentsModule />
            ) : active === "Accounting" ? (
              <AccountingModule />
            ) : active === "Reports" ? (
              <ReportsModule />
            ) : active === "Reviews" ? (
              <ReviewsModule />
            ) : active === "Notifications" ? (
              <NotificationsModule />
            ) : active === "Admin Users" ? (
              <AdminUsersModule />
            ) : active === "Audit Log" ? (
              <AuditLogModule />
            ) : active === "Settings" ? (
              <SettingsModule />
            ) : active !== "Dashboard" ? (
              <div className="rounded-2xl border bg-white p-5 text-center shadow-sm">
                <div className="text-4xl">
                  🚧
                </div>

                <h2 className="mt-4 text-base font-medium">
                  {active}
                </h2>

                <p className="mt-2 text-slate-500">
                  Module hii itaunganishwa na Business Control
                  Center hatua inayofuata.
                </p>

                <button
                  onClick={() => setActive("Dashboard")}
                  className="mt-6 rounded-xl bg-[#800020] px-5 py-3 font-bold text-white"
                >
                  Back to Dashboard
                </button>
              </div>
            ) : (
              <>
                {/* WELCOME */}
                <div className="mb-6 #ROUND rounded-2xl bg-gradient-to-r from-[#800020] to-[#A64D63] p-6 text-white shadow-lg">
                  <div className="text-sm font-medium text-[#FBECEF]">
                    GAMORA ONLINE
                  </div>

                  <h2 className="mt-1 text-base font-medium">
                    Business Overview
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm text-slate-300">
                    Hapa ndipo utaona hali ya biashara yako kwa
                    ujumla: sales, orders, payments, stock,
                    expenses na profit.
                  </p>
                </div>

{/* PERIOD */}
<div className="mb-6 flex flex-wrap gap-2">
  {[
    "Today",
    "Yesterday",
    "This Week",
    "This Month",
    "Last Month",
    "This Year",
    "Custom Range",
  ].map((option) => (
    <button
      key={option}
      onClick={() => setPeriod(option)}
      className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
        period === option
          ? "border-[#800020] bg-[#800020] text-white"
          : "bg-white text-slate-700 hover:bg-[#F8F6F6]"
      }`}
    >
      {option}
    </button>
  ))}
</div>

{period === "Custom Range" && (
  <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 shadow-sm">
    <div>
      <label className="mb-1 block text-sm font-semibold text-slate-700">
        From
      </label>
      <input
        type="date"
        value={fromDate}
        onChange={(e) => setFromDate(e.target.value)}
        className="rounded-xl border border-slate-300 px-4 py-2 text-sm"
      />
    </div>

    <div>
      <label className="mb-1 block text-sm font-semibold text-slate-700">
        To
      </label>
      <input
        type="date"
        value={toDate}
        onChange={(e) => setToDate(e.target.value)}
        className="rounded-xl border border-slate-300 px-4 py-2 text-sm"
      />
    </div>
  </div>
)}









{/* CARDS */}
                {loading ? (
                  <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
                    Loading business data...
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                    {cards.map((card) => (
                      <button
                        key={card.title}
                        type="button"
                        onClick={() => setSelectedCard(card.title)}
                        className="rounded-xl border bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-lg">
                            {card.icon}
                          </span>

                          <span className="text-xs font-bold uppercase text-slate-400">
                            {card.title}
                          </span>
                        </div>

                        <div className="mt-3 text-lg font-black text-[#800020]">
                          {card.value}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* KPI DETAILS */}
                {selectedCard && data && (
                  <div className="mt-4 rounded-2xl border bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-black text-[#800020]">
                        {selectedCard} Details
                      </h3>

                      <button
                        type="button"
                        onClick={() => setSelectedCard(null)}
                        className="rounded-lg border px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
                      >
                        Close
                      </button>
                    </div>

                    {selectedCard === "Orders" && (
                      <div className="space-y-2">
                        {(data.orders || []).map((order: any) => (
                          <div
                            key={order.id}
                            className="rounded-xl border p-3"
                          >
                            <div className="flex flex-wrap justify-between gap-2">
                              <span className="font-bold">
                                {order.order_number || `Order #${order.id}`}
                              </span>
                              <span className="font-black">
                                {money(order.total)}
                              </span>
                            </div>
                            <div className="mt-1 text-sm text-slate-500">
                              {order.status} •{" "}
                              {new Date(order.created_at).toLocaleString()}
                            </div>
                          </div>
                        ))}

                        {(!data.orders || data.orders.length === 0) && (
                          <div className="py-6 text-center text-slate-500">
                            No orders found for this period.
                          </div>
                        )}
                      </div>
                    )}

                    {selectedCard === "Revenue" && (
                      <div className="space-y-2">
                        {(data.orders || [])
                          .filter((order: any) => order.status !== "Cancelled")
                          .map((order: any) => (
                            <div
                              key={order.id}
                              className="rounded-xl border p-3"
                            >
                              <div className="flex flex-wrap justify-between gap-2">
                                <span className="font-bold">
                                  {order.order_number || `Order #${order.id}`}
                                </span>
                                <span className="font-black">
                                  {money(order.total)}
                                </span>
                              </div>
                              <div className="mt-1 text-sm text-slate-500">
                                {order.status} •{" "}
                                {new Date(order.created_at).toLocaleString()}
                              </div>
                            </div>
                          ))}

                        {(!data.orders ||
                          data.orders.filter(
                            (order: any) => order.status !== "Cancelled"
                          ).length === 0) && (
                          <div className="py-6 text-center text-slate-500">
                            No revenue records found for this period.
                          </div>
                        )}
                      </div>
                    )}

                    {selectedCard === "COGS" && (
                      <div className="space-y-2">
                        {(data.orderItems || []).map((item: any, index: number) => {
                          const cost =
                            Number(item.cost_price_at_sale || 0) *
                            Number(item.quantity || 0);

                          return (
                            <div
                              key={`${item.order_id}-${item.product_id}-${index}`}
                              className="rounded-xl border p-3"
                            >
                              <div className="flex flex-wrap justify-between gap-2">
                                <span className="font-bold">
                                  {item.product_name}
                                </span>
                                <span className="font-black">
                                  {money(cost)}
                                </span>
                              </div>

                              <div className="mt-1 text-sm text-slate-500">
                                Qty: {item.quantity} • Cost/unit:{" "}
                                {money(item.cost_price_at_sale)}
                              </div>
                            </div>
                          );
                        })}

                        {(!data.orderItems ||
                          data.orderItems.length === 0) && (
                          <div className="py-6 text-center text-slate-500">
                            No COGS records found for this period.
                          </div>
                        )}
                      </div>
                    )}

                    {selectedCard === "Gross Profit" && (
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border p-4">
                          <div className="text-sm text-slate-500">Revenue</div>
                          <div className="mt-1 font-black">
                            {money(data.summary.revenue)}
                          </div>
                        </div>

                        <div className="rounded-xl border p-4">
                          <div className="text-sm text-slate-500">COGS</div>
                          <div className="mt-1 font-black">
                            {money(data.summary.cogs)}
                          </div>
                        </div>

                        <div className="rounded-xl border p-4">
                          <div className="text-sm text-slate-500">Gross Profit</div>
                          <div className="mt-1 font-black">
                            {money(data.summary.grossProfit)}
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedCard === "Expenses" && (
                      <div className="space-y-3">
                        <div className="rounded-xl border p-4">
                          <div className="text-sm text-slate-500">
                            Total expenses for selected period
                          </div>
                          <div className="mt-1 text-xl font-black">
                            {money(data.summary.expenses)}
                          </div>
                        </div>

                        {(data.expenses || []).map(
                          (expense: any, index: number) => (
                            <div
                              key={`${expense.expense_date}-${index}`}
                              className="flex flex-wrap justify-between gap-2 rounded-xl border p-3"
                            >
                              <span className="font-bold">
                                {expense.expense_date}
                              </span>
                              <span className="font-black">
                                {money(expense.amount)}
                              </span>
                            </div>
                          )
                        )}

                        {(!data.expenses || data.expenses.length === 0) && (
                          <div className="py-6 text-center text-slate-500">
                            No expense records found for this period.
                          </div>
                        )}
                      </div>
                    )}

                    {selectedCard === "Net Profit" && (
                      <div className="grid gap-3 sm:grid-cols-5">
                        {[
                          ["Revenue", data.summary.revenue],
                          ["COGS", data.summary.cogs],
                          ["Gross Profit", data.summary.grossProfit],
                          ["Expenses", data.summary.expenses],
                          ["Net Profit", data.summary.netProfit],
                        ].map(([label, value]) => (
                          <div key={String(label)} className="rounded-xl border p-4">
                            <div className="text-sm text-slate-500">
                              {label}
                            </div>
                            <div className="mt-1 font-black">
                              {money(Number(value))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedCard === "Pending Orders" && (
                      <div className="space-y-2">
                        {(data.orders || [])
                          .filter(
                            (order: any) =>
                              order.status === "Pending" ||
                              order.status === "Processing"
                          )
                          .map((order: any) => (
                            <div key={order.id} className="rounded-xl border p-3">
                              <div className="flex flex-wrap justify-between gap-2">
                                <span className="font-bold">
                                  {order.order_number || `Order #${order.id}`}
                                </span>
                                <span className="font-black">
                                  {money(order.total)}
                                </span>
                              </div>
                              <div className="mt-1 text-sm text-slate-500">
                                {order.status} •{" "}
                                {new Date(order.created_at).toLocaleString()}
                              </div>
                            </div>
                          ))}
                        {(data.orders || []).filter(
                          (order: any) =>
                            order.status === "Pending" ||
                            order.status === "Processing"
                        ).length === 0 && (
                          <div className="py-6 text-center text-slate-500">
                            No pending orders found for this period.
                          </div>
                        )}
                      </div>
                    )}

                    {selectedCard === "Pending Payments" && (
                      <div className="space-y-2">
                        {(data.payments || [])
                          .filter(
                            (payment: any) =>
                              payment.payment_status === "Pending" ||
                              payment.payment_status === "Processing"
                          )
                          .map((payment: any, index: number) => {
                            const order = (data.orders || []).find(
                              (item: any) =>
                                Number(item.id) === Number(payment.order_id)
                            );

                            return (
                              <div
                                key={`${payment.order_id}-${index}`}
                                className="rounded-xl border p-3"
                              >
                                <div className="flex flex-wrap justify-between gap-2">
                                  <span className="font-bold">
                                    {order?.order_number ||
                                      `Order #${payment.order_id}`}
                                  </span>
                                  <span className="font-black">
                                    {money(payment.amount)}
                                  </span>
                                </div>
                                <div className="mt-1 text-sm text-slate-500">
                                  {payment.payment_status} •{" "}
                                  {new Date(payment.created_at).toLocaleString()}
                                </div>
                              </div>
                            );
                          })}
                        {(data.payments || []).filter(
                          (payment: any) =>
                            payment.payment_status === "Pending" ||
                            payment.payment_status === "Processing"
                        ).length === 0 && (
                          <div className="py-6 text-center text-slate-500">
                            No pending payments found for this period.
                          </div>
                        )}
                      </div>
                    )}

                    {selectedCard === "Low Stock" && (
                      <div className="space-y-2">
                        {(data.products || [])
                          .filter(
                            (product: any) =>
                              Number(product.stock || 0) > 0 &&
                              Number(product.stock || 0) <= 5
                          )
                          .map((product: any) => (
                            <div
                              key={product.id}
                              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
                            >
                              <div className="min-w-[180px]">
                                <div className="font-bold">
                                  {product.name || `Product #${product.id}`}
                                </div>
                                <div className="text-sm text-slate-500">
                                  Cost: {money(product.cost_price)}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  defaultValue={Number(product.stock || 0)}
                                  className="w-20 rounded-lg border px-3 py-2 text-center font-bold outline-none focus:border-[#800020]"
                                  aria-label={`Stock for ${product.name || `Product #${product.id}`}`}
                                  onChange={(event) => {
                                    const value = Number(event.target.value);
                                    if (Number.isFinite(value) && value >= 0) {
                                      event.currentTarget.dataset.value = String(value);
                                    }
                                  }}
                                />

                                <button
                                  type="button"
                                  disabled={updatingStockId === Number(product.id)}
                                  onClick={(event) => {
                                    const input = event.currentTarget
                                      .previousElementSibling as HTMLInputElement | null;

                                    if (input) {
                                      handleLowStockUpdate(product, input.value);
                                    }
                                  }}
                                  className="rounded-lg bg-[#800020] px-3 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {updatingStockId === Number(product.id)
                                    ? "Saving..."
                                    : "Save"}
                                </button>
                              </div>
                            </div>
                          ))}
                        {(data.products || []).filter(
                          (product: any) =>
                            Number(product.stock || 0) > 0 &&
                            Number(product.stock || 0) <= 5
                        ).length === 0 && (
                          <div className="py-6 text-center text-slate-500">
                            No low-stock products found.
                          </div>
                        )}
                      </div>
                    )}

                    {selectedCard === "Out of Stock" && (
                      <div className="space-y-2">
                        {(data.products || [])
                          .filter(
                            (product: any) =>
                              Number(product.stock || 0) <= 0
                          )
                          .map((product: any) => (
                            <div
                              key={product.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3"
                            >
                              <div>
                                <div className="font-bold">
                                  {product.name || `Product #${product.id}`}
                                </div>
                                <div className="text-sm text-slate-500">
                                  Cost: {money(product.cost_price)}
                                </div>
                              </div>
                              <div className="font-black text-red-600">
                                Stock: 0
                              </div>
                            </div>
                          ))}
                        {(data.products || []).filter(
                          (product: any) =>
                            Number(product.stock || 0) <= 0
                        ).length === 0 && (
                          <div className="py-6 text-center text-slate-500">
                            No out-of-stock products found.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* DASHBOARD ANALYTICS */}
                {data && (
                  <div className="mt-6 grid gap-6 lg:grid-cols-2">

                    <SalesChart
                      orders={data.orders || []}
                    />

                    <TopProducts
                      products={data.products || []}
                      orderItems={data.orderItems || []}
                    />

                  </div>
                )}


                {/* BUSINESS STATUS */}
                {data && (
                  <div className="mt-6 grid gap-6 lg:grid-cols-2">

                    <div className="rounded-2xl border bg-white p-6 shadow-sm">
                      <h3 className="text-lg font-black">
                        Business Health
                      </h3>

                      <div className="mt-5 space-y-4">

                        <div className="flex justify-between border-b pb-3">
                          <span className="text-slate-500">
                            Products
                          </span>

                          <span className="font-bold">
                            {data.summary.products}
                          </span>
                        </div>

                        <div className="flex justify-between border-b pb-3">
                          <span className="text-slate-500">
                            Orders
                          </span>

                          <span className="font-bold">
                            {data.summary.orders}
                          </span>
                        </div>

                        <div className="flex justify-between border-b pb-3">
                          <span className="text-slate-500">
                            Low Stock
                          </span>

                          <span className="font-bold text-orange-600">
                            {data.summary.lowStock}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-slate-500">
                            Out of Stock
                          </span>

                          <span className="font-bold text-red-600">
                            {data.summary.outOfStock}
                          </span>
                        </div>

                      </div>
                    </div>

                    <div className="rounded-2xl border bg-white p-6 shadow-sm">
                      <h3 className="text-lg font-black">
                        Financial Summary
                      </h3>

                      <div className="mt-5 space-y-4">

                        <div className="flex justify-between border-b pb-3">
                          <span className="text-slate-500">
                            Revenue
                          </span>

                          <span className="font-bold">
                            {money(data.summary.revenue)}
                          </span>
                        </div>

                        <div className="flex justify-between border-b pb-3">
                          <span className="text-slate-500">
                            COGS
                          </span>

                          <span className="font-bold">
                            {money(data.summary.cogs)}
                          </span>
                        </div>

                        <div className="flex justify-between border-b pb-3">
                          <span className="text-slate-500">
                            Gross Profit
                          </span>

                          <span className="font-bold text-emerald-600">
                            {money(data.summary.grossProfit)}
                          </span>
                        </div>

                        <div className="flex justify-between border-b pb-3">
                          <span className="text-slate-500">
                            Expenses
                          </span>

                          <span className="font-bold text-red-600">
                            {money(data.summary.expenses)}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="font-black">
                            Net Profit
                          </span>

                          <span className="font-black text-emerald-600">
                            {money(data.summary.netProfit)}
                          </span>
                        </div>

                      </div>
                    </div>

                  </div>
                )}

              </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
