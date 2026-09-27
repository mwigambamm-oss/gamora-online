"use client";

import { useState } from "react";

type ReportType =
  | "summary"
  | "sales"
  | "products"
  | "inventory"
  | "payments"
  | "expenses"
  | "profit-loss";

type Period =
  | "today"
  | "this-week"
  | "this-month"
  | "last-month"
  | "this-year"
  | "custom"
  | "all";

const REPORTS: { value: ReportType; label: string; icon: string; description: string }[] = [
  {
    value: "summary",
    label: "Business Summary",
    icon: "📊",
    description: "Overall business and financial performance",
  },
  {
    value: "sales",
    label: "Sales & Orders",
    icon: "🛒",
    description: "Orders, customers, revenue and payment status",
  },
  {
    value: "products",
    label: "Product Performance",
    icon: "📦",
    description: "Products sold, revenue, cost and profit",
  },
  {
    value: "inventory",
    label: "Inventory / Stock",
    icon: "🏪",
    description: "Current stock value and potential profit",
  },
  {
    value: "payments",
    label: "Payments",
    icon: "💳",
    description: "Paid transactions and payment collections",
  },
  {
    value: "expenses",
    label: "Expenses",
    icon: "💰",
    description: "Business expenses for the selected period",
  },
  {
    value: "profit-loss",
    label: "Profit & Loss",
    icon: "📈",
    description: "Revenue, COGS, expenses and profit",
  },
];

function getDates(period: Period) {
  const now = new Date();

  const localDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  if (period === "all") {
    return { from: "", to: "" };
  }

  if (period === "today") {
    const today = localDate(now);
    return { from: today, to: today };
  }

  if (period === "this-week") {
    const start = new Date(now);
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);

    return {
      from: localDate(start),
      to: localDate(now),
    };
  }

  if (period === "this-month") {
    return {
      from: localDate(new Date(now.getFullYear(), now.getMonth(), 1)),
      to: localDate(now),
    };
  }

  if (period === "last-month") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);

    return {
      from: localDate(start),
      to: localDate(end),
    };
  }

  if (period === "this-year") {
    return {
      from: localDate(new Date(now.getFullYear(), 0, 1)),
      to: localDate(now),
    };
  }

  return { from: "", to: "" };
}

export default function ReportsModule() {
  const [report, setReport] = useState<ReportType>("summary");
  const [period, setPeriod] = useState<Period>("this-month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const selectedReport = REPORTS.find((item) => item.value === report)!;

  async function download(format: "pdf" | "word" | "excel") {
    try {
      setDownloading(format);
      setMessage("");

      let start = from;
      let end = to;

      if (period !== "custom") {
        const dates = getDates(period);
        start = dates.from;
        end = dates.to;
      }

      if (period === "custom" && (!start || !end)) {
        setMessage("Please select both From and To dates.");
        return;
      }

      if (period === "custom" && start > end) {
        setMessage("From date cannot be after To date.");
        return;
      }

      const params = new URLSearchParams({
        format,
        type: report,
      });

      if (start) params.set("from", start);
      if (end) params.set("to", end);

      const response = await fetch(`/api/reports?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        let error = "Failed to generate report.";

        try {
          const data = await response.json();
          error = data.error || error;
        } catch {}

        throw new Error(error);
      }

      const blob = await response.blob();

      const disposition = response.headers.get("Content-Disposition");
      let filename = `GAMORA-${selectedReport.label.replace(/[^a-z0-9]+/gi, "-")}.${format === "word" ? "docx" : format === "excel" ? "xlsx" : "pdf"}`;

      const match = disposition?.match(/filename="?([^"]+)"?/i);
      if (match?.[1]) filename = match[1];

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      setMessage(`${selectedReport.label} downloaded successfully.`);
    } catch (error: any) {
      console.error("Report download error:", error);
      setMessage(error?.message || "Failed to download report.");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#800020] text-xl">
              📊
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#3F3437]">
                Report Center
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Generate professional GAMORA ONLINE business reports.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-2xl border border-[#E8DEE1] bg-white p-6 shadow-sm">
          <div>
            <h3 className="text-lg font-black text-[#3F3437]">
              Select Report
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Choose the report you want to download.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {REPORTS.map((item) => {
              const active = item.value === report;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setReport(item.value)}
                  className={`rounded-xl border p-4 text-left transition ${
                    active
                      ? "border-[#800020] bg-[#800020]/5 ring-1 ring-[#800020]"
                      : "border-[#E8DEE1] hover:border-[#800020]/40 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{item.icon}</span>

                    <div className="min-w-0">
                      <p
                        className={`font-bold ${
                          active ? "text-[#800020]" : "text-[#3F3437]"
                        }`}
                      >
                        {item.label}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-[#E8DEE1] bg-white p-6 shadow-sm">
          <h3 className="text-lg font-black text-[#3F3437]">
            Report Period
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Select the period covered by the report.
          </p>

          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="mt-5 w-full rounded-xl border border-[#DCCED2] bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#800020]"
          >
            <option value="today">Today</option>
            <option value="this-week">This Week</option>
            <option value="this-month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="this-year">This Year</option>
            <option value="custom">Custom Date Range</option>
            <option value="all">All Time</option>
          </select>

          {period === "custom" && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-600">
                From
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#DCCED2] px-3 py-3 outline-none focus:border-[#800020]"
                />
              </label>

              <label className="text-sm font-semibold text-slate-600">
                To
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#DCCED2] px-3 py-3 outline-none focus:border-[#800020]"
                />
              </label>
            </div>
          )}

          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Selected report
            </p>

            <div className="mt-2 flex items-center gap-3">
              <span className="text-2xl">{selectedReport.icon}</span>
              <div>
                <p className="font-black text-[#3F3437]">
                  {selectedReport.label}
                </p>
                <p className="text-xs text-slate-500">
                  GAMORA ONLINE
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#E8DEE1] bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <h3 className="text-lg font-black text-[#3F3437]">
              Download Report
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Your selected report will be generated with the GAMORA ONLINE
              branding and logo.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              disabled={!!downloading}
              onClick={() => download("pdf")}
              className="rounded-xl bg-[#800020] px-6 py-3 text-sm font-black text-white transition hover:bg-[#6b001b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {downloading === "pdf" ? "Generating..." : "📄 Download PDF"}
            </button>

            <button
              type="button"
              disabled={!!downloading}
              onClick={() => download("word")}
              className="rounded-xl border border-[#DCCED2] bg-white px-6 py-3 text-sm font-black text-[#3F3437] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {downloading === "word" ? "Generating..." : "📝 Download Word"}
            </button>

            <button
              type="button"
              disabled={!!downloading}
              onClick={() => download("excel")}
              className="rounded-xl border border-[#DCCED2] bg-white px-6 py-3 text-sm font-black text-[#3F3437] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {downloading === "excel" ? "Generating..." : "📊 Download Excel"}
            </button>
          </div>
        </div>

        {message && (
          <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
            {message}
          </div>
        )}
      </div>
    </section>
  );
}
