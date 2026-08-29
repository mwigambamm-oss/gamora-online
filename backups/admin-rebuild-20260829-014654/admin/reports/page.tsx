"use client";

import { useEffect, useState } from "react";

export default function ReportsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setAnalytics(data))
      .catch((error) => console.error("Analytics load failed:", error))
      .finally(() => setLoading(false));
  }, []);

  function download(format: "excel" | "word") {
    const params = new URLSearchParams({
      format,
    });

    if (from) params.set("from", from);
    if (to) params.set("to", to);

    window.location.href =
      `/api/reports?${params.toString()}`;
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-8">

      <div className="mx-auto max-w-6xl">

        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-widest text-orange-600">
            GAMORA ONLINE
          </p>

          <h1 className="mt-2 text-3xl font-black text-gray-900">
            Reports Center
          </h1>

          <p className="mt-2 text-gray-500">
            Generate real business reports directly from your database.
          </p>
        </div>

        {!loading && analytics?.kpis && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">

            <div className="rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 p-5 text-white shadow-lg">
              <p className="text-sm font-semibold text-orange-50">Revenue</p>
              <h2 className="mt-2 text-2xl font-black">
                TZS {Number(analytics.kpis.revenue || 0).toLocaleString()}
              </h2>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-emerald-400 to-green-700 p-5 text-white shadow-lg">
              <p className="text-sm font-semibold text-green-50">Net Profit</p>
              <h2 className="mt-2 text-2xl font-black">
                TZS {Number(analytics.kpis.netProfit || 0).toLocaleString()}
              </h2>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600 p-5 text-white shadow-lg">
              <p className="text-sm font-semibold text-blue-50">Paid</p>
              <h2 className="mt-2 text-2xl font-black">
                TZS {Number(analytics.kpis.paidRevenue || 0).toLocaleString()}
              </h2>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-violet-400 to-purple-700 p-5 text-white shadow-lg">
              <p className="text-sm font-semibold text-purple-50">Outstanding</p>
              <h2 className="mt-2 text-2xl font-black">
                TZS {Number(analytics.kpis.unpaidRevenue || 0).toLocaleString()}
              </h2>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-700 p-5 text-white shadow-lg">
              <p className="text-sm font-semibold text-cyan-50">Stock Value</p>
              <h2 className="mt-2 text-2xl font-black">
                TZS {Number(analytics.kpis.stockValueAtSellingPrice || 0).toLocaleString()}
              </h2>
            </div>

          </div>
        )}

        <section className="rounded-2xl bg-white p-6 shadow-sm">

          <h2 className="text-xl font-black text-gray-900">
            Report Period
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                From
              </label>

              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                To
              </label>

              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-orange-500"
              />
            </div>

          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">

            <button
              onClick={() => download("excel")}
              className="rounded-2xl bg-green-600 px-6 py-5 text-left text-white shadow-sm transition hover:bg-green-700"
            >
              <div className="text-3xl">📊</div>

              <div className="mt-3 text-xl font-black">
                Download Excel
              </div>

              <p className="mt-1 text-sm text-green-100">
                Orders, revenue, payments, expenses, products and stock.
              </p>
            </button>

            <button
              onClick={() => download("word")}
              className="rounded-2xl bg-blue-600 px-6 py-5 text-left text-white shadow-sm transition hover:bg-blue-700"
            >
              <div className="text-3xl">📄</div>

              <div className="mt-3 text-xl font-black">
                Download Word
              </div>

              <p className="mt-1 text-sm text-blue-100">
                Management-friendly financial and order report.
              </p>
            </button>

          </div>

        </section>

        <section className="mt-6 rounded-2xl bg-gray-950 p-6 text-white">

          <h2 className="text-lg font-black">
            Report Includes
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

            {[
              "Revenue",
              "Paid & Unpaid",
              "Product Cost / COGS",
              "Gross Profit",
              "Expenses",
              "Net Profit",
              "Delivery Income",
              "Product Performance",
              "Stock Valuation",
              "Potential Stock Profit",
              "Customer Orders",
              "Payment Status",
            ].map((item) => (
              <div
                key={item}
                className="rounded-xl border border-gray-800 px-4 py-3 text-sm text-gray-200"
              >
                ✓ {item}
              </div>
            ))}

          </div>

        </section>

      </div>

    </main>
  );
}
