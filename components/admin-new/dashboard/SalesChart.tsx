"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Order = {
  created_at: string;
  total: number;
};

export default function SalesChart({ orders }: { orders: Order[] }) {
  const grouped = orders.reduce<Record<string, number>>((acc, order) => {
    const date = new Date(order.created_at);

    if (Number.isNaN(date.getTime())) return acc;

    const key = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });

    acc[key] = (acc[key] || 0) + Number(order.total || 0);

    return acc;
  }, {});

  const data = Object.entries(grouped).map(([date, sales]) => ({
    date,
    sales,
  }));

  return (
    <div className="rounded-2xl border border-[#CBD5E1] bg-[#F8FAFC] p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-[#172033]">
            Sales Overview
          </h3>
          <p className="mt-1 text-sm text-[#64748B]">
            Revenue generated from orders in the selected period.
          </p>
        </div>

        <div className="rounded-xl bg-[#ECFEFF] px-3 py-2 text-xs font-black text-[#0F766E]">
          {orders.length} orders
        </div>
      </div>

      <div className="mt-6 h-[320px]">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-[#64748B]">
            No sales data yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value: any) =>
                  `TZS ${Number(value || 0).toLocaleString()}`
                }
              />
              <Bar
                dataKey="sales"
                name="Sales"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
