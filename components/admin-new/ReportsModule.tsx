"use client";

import { useEffect, useState } from "react";

type ReportData = {
  orders: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  pendingOrders: number;
  products: number;
};

export default function ReportsModule() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);

      const response = await fetch(
        "/api/admin/dashboard?period=This%20Month",
        { cache: "no-store" }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load report");
      }

      setData({
        orders: Number(result.summary?.orders || 0),
        revenue: Number(result.summary?.revenue || 0),
        cogs: Number(result.summary?.cogs || 0),
        grossProfit: Number(result.summary?.grossProfit || 0),
        expenses: Number(result.summary?.expenses || 0),
        netProfit: Number(result.summary?.netProfit || 0),
        pendingOrders: Number(result.summary?.pendingOrders || 0),
        products: Number(result.summary?.products || 0),
      });
    } catch (error) {
      console.error("Reports error:", error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const money = (value: number) =>
    `TZS ${Number(value || 0).toLocaleString()}`;

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-black text-[#3F3437]">
            Reports
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Monthly business performance and financial summary.
          </p>
        </div>

        <button
          onClick={load}
          className="rounded-xl bg-[#800020] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#6b001b]"
        >
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[#E8DEE1] bg-white p-10 text-center shadow-sm">
          <div className="text-4xl">📊</div>
          <p className="mt-3 font-bold">Loading report...</p>
        </div>
      ) : !data ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          Failed to load report data.
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Orders", data.orders.toLocaleString()],
              ["Revenue", money(data.revenue)],
              ["Gross Profit", money(data.grossProfit)],
              ["Net Profit", money(data.netProfit)],
            ].map(([title, value]) => (
              <div
                key={title}
                className="rounded-2xl border border-[#E8DEE1] bg-white p-5 shadow-sm"
              >
                <p className="text-sm text-slate-500">{title}</p>
                <p className="mt-2 text-2xl font-black text-[#3F3437]">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[#E8DEE1] bg-white p-6 shadow-sm">
              <h3 className="text-lg font-black">Financial Summary</h3>

              <div className="mt-5 space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">Revenue</span>
                  <b>{money(data.revenue)}</b>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Cost of Goods</span>
                  <b>{money(data.cogs)}</b>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Gross Profit</span>
                  <b>{money(data.grossProfit)}</b>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Expenses</span>
                  <b>{money(data.expenses)}</b>
                </div>

                <div className="border-t pt-4 flex justify-between">
                  <span className="font-bold">Net Profit</span>
                  <b className="text-[#800020]">
                    {money(data.netProfit)}
                  </b>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E8DEE1] bg-white p-6 shadow-sm">
              <h3 className="text-lg font-black">Business Overview</h3>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Products</p>
                  <p className="mt-1 text-2xl font-black">
                    {data.products.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-xl bg-yellow-50 p-4">
                  <p className="text-xs text-slate-500">Pending Orders</p>
                  <p className="mt-1 text-2xl font-black text-yellow-700">
                    {data.pendingOrders.toLocaleString()}
                  </p>
                </div>
              </div>

              <a
                href="/admin/reports"
                className="mt-5 block rounded-xl border border-[#E8DEE1] px-4 py-3 text-center text-sm font-bold transition hover:bg-slate-50"
              >
                Open Full Reports Center →
              </a>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
