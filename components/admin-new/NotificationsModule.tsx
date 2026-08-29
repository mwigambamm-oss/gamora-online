"use client";

import { useEffect, useState } from "react";

type AlertItem = {
  type: "warning" | "danger" | "info";
  title: string;
  message: string;
  icon: string;
};

export default function NotificationsModule() {
  const [items, setItems] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);

      const response = await fetch(
        "/api/admin/dashboard?period=Today",
        { cache: "no-store" }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load notifications");
      }

      const summary = result.summary || {};
      const alerts: AlertItem[] = [];

      if (Number(summary.pendingOrders || 0) > 0) {
        alerts.push({
          type: "warning",
          title: "Pending Orders",
          message: `${summary.pendingOrders} order(s) are waiting for action.`,
          icon: "🛒",
        });
      }

      if (Number(summary.pendingPayments || 0) > 0) {
        alerts.push({
          type: "warning",
          title: "Pending Payments",
          message: `${summary.pendingPayments} payment transaction(s) need attention.`,
          icon: "💳",
        });
      }

      if (Number(summary.lowStock || 0) > 0) {
        alerts.push({
          type: "warning",
          title: "Low Stock",
          message: `${summary.lowStock} product(s) have low stock.`,
          icon: "📦",
        });
      }

      if (Number(summary.outOfStock || 0) > 0) {
        alerts.push({
          type: "danger",
          title: "Out of Stock",
          message: `${summary.outOfStock} product(s) are out of stock.`,
          icon: "🚨",
        });
      }

      if (alerts.length === 0) {
        alerts.push({
          type: "info",
          title: "All Clear",
          message: "No urgent business notifications right now.",
          icon: "✅",
        });
      }

      setItems(alerts);
    } catch (error) {
      console.error("Notifications error:", error);
      setItems([
        {
          type: "danger",
          title: "Unable to Load",
          message: "Business notifications could not be loaded.",
          icon: "⚠️",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#3F3437]">
            Notifications
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Important business alerts and system notifications.
          </p>
        </div>

        <button
          onClick={load}
          className="rounded-xl border border-[#E8DEE1] bg-white px-5 py-3 text-sm font-bold hover:bg-slate-50"
        >
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[#E8DEE1] bg-white p-10 text-center text-slate-500 shadow-sm">
          Loading notifications...
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={`${item.title}-${index}`}
              className="rounded-2xl border border-[#E8DEE1] bg-white p-5 shadow-sm"
            >
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F8EDEF] text-xl">
                  {item.icon}
                </div>

                <div>
                  <p className="font-black text-[#3F3437]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
