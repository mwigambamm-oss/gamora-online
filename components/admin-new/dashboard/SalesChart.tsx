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
  total_amount?: number;
  total?: number;
  amount?: number;
};

export default function SalesChart({
  revenue,
  cogs,
  grossProfit,
  expenses,
  netProfit,
}: {
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
}) {
  const rows = [
    { name: "Revenue", value: Number(revenue || 0) },
    { name: "COGS", value: Number(cogs || 0) },
    { name: "Gross Profit", value: Number(grossProfit || 0) },
    { name: "Expenses", value: Number(expenses || 0) },
    { name: "Net Profit", value: Number(netProfit || 0) },
  ];

  return (
    <div className="rounded-2xl border border-[#D5DCE5] bg-[#F8FAFC] p-6 shadow-sm">
      <div className="mb-5">
        <h3 className="text-lg font-bold text-[#172033]">
          Financial Performance
        </h3>
        <p className="mt-1 text-sm text-[#64748B]">
          Financial summary for the selected period.
        </p>
      </div>

      <div className="space-y-4">
        {rows.map((item) => {
          const max = Math.max(...rows.map((x) => x.value), 1);
          const width = Math.max((item.value / max) * 100, item.value > 0 ? 3 : 0);

          return (
            <div key={item.name}>
              <div className="mb-1 flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-[#475569]">
                  {item.name}
                </span>
                <span className="text-sm font-bold text-[#172033]">
                  TZS {item.value.toLocaleString()}
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-[#E2E8F0]">
                <div
                  className="h-full rounded-full bg-[#0F766E]"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
