"use client";

import { useEffect, useState } from "react";

type AnalyticsData = {
  success: boolean;
  kpis: {
    orders: number;
    revenue: number;
    merchandiseRevenue: number;
    deliveryIncome: number;
    cogs: number;
    merchandiseGrossProfit: number;
    grossProfit: number;
    expenses: number;
    netProfit: number;
    profitMargin: number;
    stockCostValue: number;
    stockSellingValue: number;
    paidAmount: number;
    unpaidAmount: number;
  };
  topProducts: Array<{
    name: string;
    quantity: number;
    sales: number;
    cost: number;
    profit: number;
  }>;
  lowStock: Array<{
    id: number;
    name: string;
    price: number;
    cost_price?: number;
    stock: number;
    category: string;
    image?: string;
  }>;
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAnalytics() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/analytics", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Failed to load analytics"
        );
      }

      setData(result);
    } catch (err: any) {
      console.error("Analytics loading error:", err);
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  const money = (value: number) =>
    `TZS ${Number(value || 0).toLocaleString()}`;

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
            <div className="text-5xl">📊</div>
            <h1 className="mt-4 text-2xl font-black">
              GAMORA Financial Intelligence
            </h1>
            <p className="mt-2 text-slate-400">
              Loading real business data...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8">
            <h1 className="text-2xl font-black">
              ⚠️ Analytics Error
            </h1>

            <p className="mt-3 text-red-200">
              {error || "No analytics data available"}
            </p>

            <button
              onClick={loadAnalytics}
              className="mt-6 rounded-xl bg-white px-5 py-3 font-bold text-slate-950"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  const k = data.kpis;

  const stockPotentialProfit =
    Number(k.stockSellingValue || 0) -
    Number(k.stockCostValue || 0);

  const paymentCoverage =
    k.revenue > 0
      ? (k.paidAmount / k.revenue) * 100
      : 0;

  const cards = [
    {
      title: "Total Sales",
      value: money(k.revenue),
      sub: `${k.orders} non-cancelled orders`,
      icon: "💰",
    },
    {
      title: "Cost of Goods",
      value: money(k.cogs),
      sub: "Actual buying cost",
      icon: "📦",
    },
    {
      title: "Gross Profit",
      value: money(k.grossProfit),
      sub: `${k.revenue > 0 ? ((k.grossProfit / k.revenue) * 100).toFixed(1) : 0}% gross margin`,
      icon: "📈",
    },
    {
      title: "Net Profit",
      value: money(k.netProfit),
      sub: `${Number(k.profitMargin || 0).toFixed(1)}% net margin`,
      icon: "💎",
    },
    {
      title: "Paid",
      value: money(k.paidAmount),
      sub: `${paymentCoverage.toFixed(1)}% of sales recorded as paid`,
      icon: "✅",
    },
    {
      title: "Unpaid",
      value: money(k.unpaidAmount),
      sub: "Outstanding customer payments",
      icon: "⏳",
    },
    {
      title: "Expenses",
      value: money(k.expenses),
      sub: "Recorded business expenses",
      icon: "💸",
    },
    {
      title: "Delivery Income",
      value: money(k.deliveryIncome),
      sub: "Delivery charges collected",
      icon: "🚚",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl p-5 md:p-8">

        {/* HEADER */}
        <header className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-2xl shadow-lg shadow-orange-500/20">
                G
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-orange-400">
                  GAMORA ONLINE
                </p>

                <h1 className="text-3xl font-black md:text-4xl">
                  Financial Intelligence
                </h1>
              </div>
            </div>

            <p className="mt-3 text-sm text-slate-400">
              Real-time business performance from Supabase
            </p>
          </div>

          <button
            onClick={loadAnalytics}
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold transition hover:bg-white/10"
          >
            🔄 Refresh Data
          </button>
        </header>

        {/* PRIMARY KPI GRID */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.title}
              className="group rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/10 backdrop-blur transition hover:-translate-y-1 hover:bg-white/[0.09]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    {card.title}
                  </p>

                  <p className="mt-3 text-2xl font-black tracking-tight md:text-3xl">
                    {card.value}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-xl">
                  {card.icon}
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-500">
                {card.sub}
              </p>
            </div>
          ))}
        </section>

        {/* PROFIT + STOCK */}
        <section className="mt-6 grid gap-6 lg:grid-cols-2">

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-400">
                  PROFITABILITY
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  Business Profit
                </h2>
              </div>

              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                LIVE
              </span>
            </div>

            <div className="mt-6 space-y-4">

              <div className="flex justify-between border-b border-white/10 pb-4">
                <span className="text-slate-400">
                  Merchandise Revenue
                </span>
                <strong>
                  {money(k.merchandiseRevenue)}
                </strong>
              </div>

              <div className="flex justify-between border-b border-white/10 pb-4">
                <span className="text-slate-400">
                  Buying Cost / COGS
                </span>
                <strong className="text-red-400">
                  - {money(k.cogs)}
                </strong>
              </div>

              <div className="flex justify-between border-b border-white/10 pb-4">
                <span className="text-slate-400">
                  Gross Profit
                </span>
                <strong className="text-emerald-400">
                  {money(k.grossProfit)}
                </strong>
              </div>

              <div className="flex justify-between border-b border-white/10 pb-4">
                <span className="text-slate-400">
                  Expenses
                </span>
                <strong className="text-red-400">
                  - {money(k.expenses)}
                </strong>
              </div>

              <div className="flex justify-between pt-1">
                <span className="font-bold">
                  NET PROFIT
                </span>

                <strong className="text-2xl text-emerald-400">
                  {money(k.netProfit)}
                </strong>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <p className="text-sm font-bold text-slate-400">
              INVENTORY INTELLIGENCE
            </p>

            <h2 className="mt-1 text-2xl font-black">
              Stock Value
            </h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">

              <div className="rounded-2xl bg-blue-500/10 p-5">
                <p className="text-sm text-slate-400">
                  Buying Value
                </p>

                <p className="mt-2 text-xl font-black">
                  {money(k.stockCostValue)}
                </p>
              </div>

              <div className="rounded-2xl bg-orange-500/10 p-5">
                <p className="text-sm text-slate-400">
                  Selling Value
                </p>

                <p className="mt-2 text-xl font-black">
                  {money(k.stockSellingValue)}
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-500/10 p-5 sm:col-span-2">
                <p className="text-sm text-slate-400">
                  Potential Profit From Current Stock
                </p>

                <p className="mt-2 text-3xl font-black text-emerald-400">
                  {money(stockPotentialProfit)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* TOP PRODUCTS */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.06] p-6">
          <div className="mb-5">
            <p className="text-sm font-bold text-orange-400">
              SALES INTELLIGENCE
            </p>

            <h2 className="text-2xl font-black">
              Top Products
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-3">Product</th>
                  <th className="px-3 py-3">Units</th>
                  <th className="px-3 py-3">Sales</th>
                  <th className="px-3 py-3">Cost</th>
                  <th className="px-3 py-3">Profit</th>
                </tr>
              </thead>

              <tbody>
                {data.topProducts.map((product, index) => (
                  <tr
                    key={`${product.name}-${index}`}
                    className="border-b border-white/5"
                  >
                    <td className="px-3 py-4 font-bold">
                      {index + 1}. {product.name}
                    </td>

                    <td className="px-3 py-4 text-slate-300">
                      {product.quantity}
                    </td>

                    <td className="px-3 py-4">
                      {money(product.sales)}
                    </td>

                    <td className="px-3 py-4 text-red-400">
                      {money(product.cost)}
                    </td>

                    <td className="px-3 py-4 font-black text-emerald-400">
                      {money(product.profit)}
                    </td>
                  </tr>
                ))}

                {!data.topProducts.length && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-8 text-center text-slate-500"
                    >
                      No sales data available yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* LOW STOCK */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.06] p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-red-400">
                INVENTORY ALERT
              </p>

              <h2 className="text-2xl font-black">
                Low Stock
              </h2>
            </div>

            <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400">
              {data.lowStock.length} ITEMS
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {data.lowStock.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/10 p-4"
              >
                <div>
                  <p className="font-bold">
                    {product.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {product.category}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-black text-red-400">
                    {product.stock} left
                  </p>

                  <p className="text-xs text-slate-500">
                    Cost: {money(product.cost_price || 0)}
                  </p>
                </div>
              </div>
            ))}

            {!data.lowStock.length && (
              <p className="text-sm text-slate-500">
                ✅ No low-stock products.
              </p>
            )}
          </div>
        </section>

        {/* ACCOUNTING NOTE */}
        <section className="mt-6 rounded-3xl border border-blue-400/10 bg-blue-500/[0.06] p-6">
          <h3 className="font-black">
            🧠 GAMORA Accounting Logic
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Product profit uses the actual buying price
            recorded on the product. Paid revenue is based
            only on recorded payment transactions. Expenses
            are deducted from gross profit to calculate net
            profit. Cancelled orders are excluded.
          </p>
        </section>

      </div>
    </main>
  );
}
