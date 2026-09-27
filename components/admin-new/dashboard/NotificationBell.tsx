"use client";

import { useEffect, useRef, useState } from "react";

type NotificationItem = {
  type: "warning" | "danger" | "info";
  title: string;
  message: string;
  icon: string;
};

export default function NotificationBell({
  pendingOrders = 0,
  pendingPayments = 0,
  lowStock = 0,
  outOfStock = 0,
  onClick,
}: {
  pendingOrders?: number;
  pendingPayments?: number;
  lowStock?: number;
  outOfStock?: number;
  onClick: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const total =
    pendingOrders +
    pendingPayments +
    lowStock +
    outOfStock;

  const notifications: NotificationItem[] = [];

  if (pendingOrders > 0) {
    notifications.push({
      type: "warning",
      title: "Pending Orders",
      message: `${pendingOrders} order(s) are waiting for action.`,
      icon: "🛒",
    });
  }

  if (pendingPayments > 0) {
    notifications.push({
      type: "warning",
      title: "Pending Payments",
      message: `${pendingPayments} payment transaction(s) need attention.`,
      icon: "💳",
    });
  }

  if (lowStock > 0) {
    notifications.push({
      type: "warning",
      title: "Low Stock",
      message: `${lowStock} product(s) have low stock.`,
      icon: "📦",
    });
  }

  if (outOfStock > 0) {
    notifications.push({
      type: "danger",
      title: "Out of Stock",
      message: `${outOfStock} product(s) are out of stock.`,
      icon: "🚨",
    });
  }

  if (notifications.length === 0) {
    notifications.push({
      type: "info",
      title: "All Clear",
      message: "No urgent business notifications right now.",
      icon: "✅",
    });
  }

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        ref.current &&
        !ref.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  function handleBellClick() {
    setOpen((value) => !value);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleBellClick}
        aria-label="Open notifications"
        aria-expanded={open}
        className="relative rounded-xl border border-[#CBD5E1] bg-[#E2E8F0] px-4 py-3 shadow-sm transition hover:bg-[#CBD5E1]"
      >
        🔔

        {total > 0 && (
          <span className="absolute -right-1 -top-1 rounded-full bg-[#E30613] px-2 py-0.5 text-xs font-black text-white">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-3 w-[360px] overflow-hidden rounded-2xl border border-[#CBD5E1] bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
            <div>
              <h3 className="text-base font-black text-[#111827]">
                Notifications
              </h3>
              <p className="mt-0.5 text-xs text-[#64748B]">
                Business alerts
              </p>
            </div>

            {total > 0 && (
              <span className="rounded-full bg-[#FEE2E2] px-2.5 py-1 text-xs font-black text-[#E30613]">
                {total} alert{total === 1 ? "" : "s"}
              </span>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto p-3">
            <div className="space-y-2">
              {notifications.map((item, index) => (
                <button
                  key={`${item.title}-${index}`}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onClick();
                  }}
                  className="flex w-full gap-3 rounded-xl p-3 text-left transition hover:bg-[#F8FAFC]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F1F5F9] text-lg">
                    {item.icon}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-black text-[#1E293B]">
                      {item.title}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#64748B]">
                      {item.message}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-[#E2E8F0] p-3">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onClick();
              }}
              className="w-full rounded-xl bg-[#111827] px-4 py-3 text-sm font-black text-white transition hover:bg-[#1F2937]"
            >
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
