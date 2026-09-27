"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = {
  orders?: any[];
  orderItems?: any[];
  payments?: any[];
  products?: any[];
  expenses?: any[];
  revenue?: number;
  cogs?: number;
  grossProfit?: number;
  totalExpenses?: number;
  netProfit?: number;
};

const money = (value: number) =>
  new Intl.NumberFormat("en-TZ", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatAxis = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return String(value);
};

function statusName(value: any) {
  return String(value || "Unknown")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (x) => x.toUpperCase());
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#D7DEE8] bg-white p-6 shadow-sm">
      <div>
        <h3 className="text-lg font-black text-[#172033]">{title}</h3>
        <p className="mt-1 text-xs font-medium text-slate-500">
          {subtitle}
        </p>
      </div>

      <div className="mt-5 h-[310px]">
        {children}
      </div>
    </div>
  );
}

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid #D7DEE8",
  background: "#FFFFFF",
  boxShadow: "0 8px 25px rgba(15,23,42,0.08)",
};

export default function BusinessCharts({
  orders = [],
  orderItems = [],
  payments = [],
  products = [],
  expenses = [],
  revenue = 0,
  cogs = 0,
  grossProfit = 0,
  totalExpenses = 0,
  netProfit = 0,
}: Props) {
  const financialData = [
    { name: "Revenue", amount: Number(revenue || 0) },
    { name: "COGS", amount: Number(cogs || 0) },
    { name: "Gross Profit", amount: Number(grossProfit || 0) },
    { name: "Expenses", amount: Number(totalExpenses || 0) },
    { name: "Net Profit", amount: Number(netProfit || 0) },
  ];

  const orderMap: Record<string, number> = {};

  orders.forEach((order: any) => {
    const status = statusName(
      order.status ??
        order.order_status ??
        order.orderStatus
    );

    orderMap[status] = (orderMap[status] || 0) + 1;
  });

  const orderStatusData = Object.entries(orderMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const paymentMap: Record<string, number> = {};

  payments.forEach((payment: any) => {
    const status = statusName(
      payment.status ??
        payment.payment_status ??
        payment.paymentStatus
    );

    paymentMap[status] = (paymentMap[status] || 0) + 1;
  });

  const paymentStatusData = Object.entries(paymentMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const inventoryData = [
    {
      name: "In Stock",
      count: products.filter(
        (p: any) => Number(p.stock || 0) > 5
      ).length,
    },
    {
      name: "Low Stock",
      count: products.filter((p: any) => {
        const stock = Number(p.stock || 0);
        return stock > 0 && stock <= 5;
      }).length,
    },
    {
      name: "Out of Stock",
      count: products.filter(
        (p: any) => Number(p.stock || 0) <= 0
      ).length,
    },
  ];

  const expenseMap: Record<string, number> = {};

  expenses.forEach((expense: any) => {
    const category = statusName(
      expense.category ??
        expense.expense_category ??
        expense.type ??
        "Other"
    );

    const amount = Number(
      expense.amount ??
        expense.total ??
        expense.value ??
        0
    );

    expenseMap[category] = (expenseMap[category] || 0) + amount;
  });

  const expenseData = Object.entries(expenseMap)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  const productMap: Record<string, number> = {};

  orderItems.forEach((item: any) => {
    const name =
      item.product_name ||
      products.find(
        (p: any) =>
          String(p.id) === String(item.product_id)
      )?.name ||
      "Unnamed Product";

    productMap[name] =
      (productMap[name] || 0) +
      Number(item.quantity || 0);
  });

  const productData = Object.entries(productMap)
    .map(([name, quantity]) => ({
      name:
        name.length > 25
          ? `${name.substring(0, 25)}…`
          : name,
      quantity,
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8);

  return (
    <>
      <ChartCard
        title="Financial Performance"
        subtitle="Financial summary for the selected period"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={financialData}
            margin={{ top: 15, right: 25, left: 45, bottom: 10 }}
          >
            <CartesianGrid
              stroke="#E2E8F0"
              vertical={false}
            />

            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#64748B" }}
              axisLine={{ stroke: "#CBD5E1" }}
              tickLine={false}
            />

            <YAxis
              tick={{ fontSize: 11, fill: "#64748B" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatAxis}
            />

            <Tooltip
              formatter={(value: any) =>
                `TZS ${money(Number(value))}`
              }
              contentStyle={tooltipStyle}
            />

            <Bar
              dataKey="amount"
              name="Amount"
              fill="#0F766E"
              radius={[7, 7, 0, 0]}
              maxBarSize={55}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Order Status"
        subtitle="Orders grouped by current status"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={orderStatusData}
            margin={{ top: 15, right: 25, left: 20, bottom: 10 }}
          >
            <CartesianGrid
              stroke="#E2E8F0"
              vertical={false}
            />

            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "#64748B" }}
              tickLine={false}
              axisLine={{ stroke: "#CBD5E1" }}
            />

            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#64748B" }}
              tickLine={false}
              axisLine={false}
            />

            <Tooltip contentStyle={tooltipStyle} />
            <Legend />

            <Bar
              dataKey="count"
              name="Orders"
              fill="#7C3AED"
              radius={[7, 7, 0, 0]}
              maxBarSize={60}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Payment Status"
        subtitle="Payments grouped by status"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={paymentStatusData}
            margin={{ top: 15, right: 25, left: 20, bottom: 10 }}
          >
            <CartesianGrid
              stroke="#E2E8F0"
              vertical={false}
            />

            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "#64748B" }}
              tickLine={false}
              axisLine={{ stroke: "#CBD5E1" }}
            />

            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#64748B" }}
              tickLine={false}
              axisLine={false}
            />

            <Tooltip contentStyle={tooltipStyle} />
            <Legend />

            <Bar
              dataKey="count"
              name="Payments"
              fill="#0891B2"
              radius={[7, 7, 0, 0]}
              maxBarSize={60}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Inventory Status"
        subtitle="Current stock position across products"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={inventoryData}
            margin={{ top: 15, right: 25, left: 20, bottom: 10 }}
          >
            <CartesianGrid
              stroke="#E2E8F0"
              vertical={false}
            />

            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#64748B" }}
              tickLine={false}
              axisLine={{ stroke: "#CBD5E1" }}
            />

            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#64748B" }}
              tickLine={false}
              axisLine={false}
            />

            <Tooltip contentStyle={tooltipStyle} />
            <Legend />

            <Bar
              dataKey="count"
              name="Products"
              fill="#F59E0B"
              radius={[7, 7, 0, 0]}
              maxBarSize={70}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Expenses by Category"
        subtitle="Expense breakdown for the selected period"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={expenseData}
            margin={{ top: 15, right: 25, left: 50, bottom: 10 }}
          >
            <CartesianGrid
              stroke="#E2E8F0"
              vertical={false}
            />

            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "#64748B" }}
              tickLine={false}
              axisLine={{ stroke: "#CBD5E1" }}
            />

            <YAxis
              tick={{ fontSize: 11, fill: "#64748B" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatAxis}
            />

            <Tooltip
              formatter={(value: any) =>
                `TZS ${money(Number(value))}`
              }
              contentStyle={tooltipStyle}
            />

            <Legend />

            <Bar
              dataKey="amount"
              name="Expense"
              fill="#F97316"
              radius={[7, 7, 0, 0]}
              maxBarSize={55}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Top Selling Products"
        subtitle="Products ranked by units sold"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={productData}
            layout="vertical"
            margin={{ top: 10, right: 25, left: 90, bottom: 10 }}
          >
            <CartesianGrid
              stroke="#E2E8F0"
              horizontal={false}
            />

            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#64748B" }}
              tickLine={false}
              axisLine={{ stroke: "#CBD5E1" }}
            />

            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fontSize: 10, fill: "#64748B" }}
              tickLine={false}
              axisLine={false}
            />

            <Tooltip contentStyle={tooltipStyle} />
            <Legend />

            <Bar
              dataKey="quantity"
              name="Units Sold"
              fill="#7C3AED"
              radius={[0, 7, 7, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </>
  );
}
