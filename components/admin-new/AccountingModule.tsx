"use client";

import { useEffect, useState } from "react";

type Summary = {
  orders: number;
  productRevenue: number;
  deliveryIncome: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMargin: number;
  expenses: number;
  netProfit: number;
  netMargin: number;
  paidAmount: number;
  unpaidAmount: number;
  paymentMethods: Record<string, number>;
  stockCostValue: number;
  stockSellingValue: number;
  pendingOrders: number;
  pendingPayments: number;
  lowStock: number;
  outOfStock: number;
  products: number;
};

const money = (n: number) =>
  `TZS ${Number(n || 0).toLocaleString()}`;

function StatCard({
  title,
  value,
  subtitle,
  tone = "default",
}: {
  title: string;
  value: string;
  subtitle?: string;
  tone?: "default" | "green" | "red" | "maroon";
}) {
  const valueClass =
    tone === "green"
      ? "text-green-700"
      : tone === "red"
        ? "text-red-600"
        : tone === "maroon"
          ? "text-[#800020]"
          : "text-[#3F3437]";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {title}
      </p>

      <h3 className={`mt-2 text-2xl font-black ${valueClass}`}>
        {value}
      </h3>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-500">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default function AccountingModule() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  type Expense = {
    id: number;
    title: string;
    amount: number;
    category: string;
    expense_date: string;
    notes?: string | null;
  };

  const EXPENSE_CATEGORIES = [
    "Marketing",
    "Transport / Delivery",
    "Salaries",
    "Rent",
    "Internet & Communication",
    "Packaging",
    "Bank / Payment Charges",
    "Utilities",
    "Office Expenses",
    "Maintenance",
    "Other",
  ];

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [expenseSaving, setExpenseSaving] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [expenseForm, setExpenseForm] = useState({
    title: "",
    amount: "",
    category: "Other",
    expense_date: new Date().toISOString().slice(0, 10),
    notes: "",
  });


  type Payment = {
    id: number;
    order_number: string;
    amount: number;
    payment_method: string;
    payment_status: string;
    transaction_ref?: string | null;
    created_at: string;
  };

  type AccountingOrder = {
    id: number;
    order_number: string;
    total: number;
    status: string;
    customer_name?: string | null;
    customer_phone?: string | null;
  };

  const PAYMENT_METHODS = [
    "Cash",
    "M-Pesa",
    "Airtel Money",
    "Tigo Pesa",
    "HaloPesa",
    "Bank Transfer",
    "Card",
    "Other",
  ];

  const PAYMENT_STATUSES = [
    "Paid",
    "Pending",
  ];

  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentOrders, setPaymentOrders] = useState<AccountingOrder[]>([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  const [paymentForm, setPaymentForm] = useState({
    order_id: "",
    amount: "",
    payment_method: "Cash",
    payment_status: "Paid",
    transaction_ref: "",
  });

  const loadPayments = async () => {
    try {
      setPaymentLoading(true);

      const res = await fetch("/api/accounting/payments", {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load payments");
      }

      setPayments(Array.isArray(json.payments) ? json.payments : []);
      setPaymentOrders(Array.isArray(json.orders) ? json.orders : []);
    } catch (error: any) {
      console.error("Load payments error:", error);
      alert(error.message || "Failed to load payments.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      order_id: "",
      amount: "",
      payment_method: "Cash",
      payment_status: "Paid",
      transaction_ref: "",
    });
    setEditingPayment(null);
    setShowPaymentForm(false);
  };

  const startEditPayment = (payment: Payment) => {
    const order = paymentOrders.find(
      (item) => item.order_number === payment.order_number
    );

    setEditingPayment(payment);

    setPaymentForm({
      order_id: order ? String(order.id) : "",
      amount: String(payment.amount ?? ""),
      payment_method: payment.payment_method || "Cash",
      payment_status: payment.payment_status || "Paid",
      transaction_ref: payment.transaction_ref || "",
    });

    setShowPaymentForm(true);
  };

  const savePayment = async () => {
    const amount = Number(paymentForm.amount);

    if (!editingPayment && !paymentForm.order_id) {
      alert("Select an order.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Enter a valid payment amount.");
      return;
    }

    if (!paymentForm.payment_method) {
      alert("Select payment method.");
      return;
    }

    try {
      setPaymentSaving(true);

      const method = editingPayment ? "PUT" : "POST";

      const body = editingPayment
        ? {
            id: editingPayment.id,
            amount,
            payment_method: paymentForm.payment_method,
            payment_status: paymentForm.payment_status,
            transaction_ref: paymentForm.transaction_ref.trim() || null,
          }
        : {
            order_id: Number(paymentForm.order_id),
            amount,
            payment_method: paymentForm.payment_method,
            payment_status: paymentForm.payment_status,
            transaction_ref: paymentForm.transaction_ref.trim() || null,
          };

      const res = await fetch("/api/accounting/payments", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save payment");
      }

      resetPaymentForm();
      await loadPayments();
      await load();
    } catch (error: any) {
      console.error("Save payment error:", error);
      alert(error.message || "Failed to save payment.");
    } finally {
      setPaymentSaving(false);
    }
  };

  const deletePayment = async (id: number) => {
    if (!window.confirm("Delete this payment? This action cannot be undone.")) {
      return;
    }

    try {
      setPaymentSaving(true);

      const res = await fetch("/api/accounting/payments", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete payment");
      }

      await loadPayments();
      await load();
    } catch (error: any) {
      console.error("Delete payment error:", error);
      alert(error.message || "Failed to delete payment.");
    } finally {
      setPaymentSaving(false);
    }
  };

  const loadExpenses = async () => {
    try {
      setExpenseLoading(true);

      const res = await fetch("/api/accounting/expenses", {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load expenses");
      }

      setExpenses(Array.isArray(json.expenses) ? json.expenses : []);
    } catch (error: any) {
      console.error("Load expenses error:", error);
      alert(error.message || "Failed to load expenses.");
    } finally {
      setExpenseLoading(false);
    }
  };

  const resetExpenseForm = () => {
    setExpenseForm({
      title: "",
      amount: "",
      category: "Other",
      expense_date: new Date().toISOString().slice(0, 10),
      notes: "",
    });
    setEditingExpense(null);
    setShowExpenseForm(false);
  };

  const startEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      title: expense.title || "",
      amount: String(expense.amount ?? ""),
      category: expense.category || "Other",
      expense_date:
        expense.expense_date || new Date().toISOString().slice(0, 10),
      notes: expense.notes || "",
    });
    setShowExpenseForm(true);
  };

  const saveExpense = async () => {
    const title = expenseForm.title.trim();
    const amount = Number(expenseForm.amount);

    if (!title) {
      alert("Enter expense title.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Enter a valid expense amount.");
      return;
    }

    if (!expenseForm.expense_date) {
      alert("Select expense date.");
      return;
    }

    try {
      setExpenseSaving(true);

      const method = editingExpense ? "PUT" : "POST";

      const body = editingExpense
        ? {
            id: editingExpense.id,
            ...expenseForm,
            amount,
          }
        : {
            ...expenseForm,
            amount,
          };

      const res = await fetch("/api/accounting/expenses", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save expense");
      }

      resetExpenseForm();
      await loadExpenses();
      await load();
    } catch (error: any) {
      console.error("Save expense error:", error);
      alert(error.message || "Failed to save expense.");
    } finally {
      setExpenseSaving(false);
    }
  };

  const deleteExpense = async (id: number) => {
    if (!window.confirm("Delete this expense? This action cannot be undone.")) {
      return;
    }

    try {
      setExpenseSaving(true);

      const res = await fetch("/api/accounting/expenses", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete expense");
      }

      await loadExpenses();
      await load();
    } catch (error: any) {
      console.error("Delete expense error:", error);
      alert(error.message || "Failed to delete expense.");
    } finally {
      setExpenseSaving(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const [period, setPeriod] = useState("This Month");

  async function load() {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/admin/dashboard?period=${encodeURIComponent(period)}`,
        {
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (data.success) {
        setSummary(data.summary);
      } else {
        console.error(data.error);
        setSummary(null);
      }
    } catch (error) {
      console.error(error);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [period]);

  return (
    <section className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-wrap items-end justify-between gap-4">

        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[#800020]">
            GAMORA ONLINE
          </p>

          <h2 className="text-3xl font-black text-[#3F3437]">
            Accounting
          </h2>

          <p className="text-sm text-slate-500">
            Financial control center
          </p>
        </div>

        <div className="flex items-center gap-2">

          <button
            onClick={load}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>

          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none"
          >
            <option>Today</option>
            <option>Yesterday</option>
            <option>This Week</option>
            <option>This Month</option>
            <option>Last Month</option>
            <option>This Year</option>
          </select>

        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <p className="font-bold text-slate-600">
            Loading accounting...
          </p>
        </div>
      )}

      {/* EMPTY / ERROR */}
      {!loading && !summary && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-bold text-red-700">
            Unable to load accounting data.
          </p>

          <button
            onClick={load}
            className="mt-3 rounded-xl bg-[#800020] px-5 py-2 text-sm font-bold text-white"
          >
            Try Again
          </button>
        </div>
      )}

      {/* DASHBOARD */}
      {!loading && summary && (
        <>

          {/* PRIMARY FINANCIAL CARDS */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <StatCard
              title="Total Revenue"
              value={money(summary.revenue)}
              subtitle={`${summary.orders} orders`}
            />

            <StatCard
              title="Gross Profit"
              value={money(summary.grossProfit)}
              subtitle={`${Number(summary.grossMargin || 0).toFixed(1)}% gross margin`}
              tone="green"
            />

            <StatCard
              title="Expenses"
              value={money(summary.expenses)}
              subtitle="Operating expenses"
              tone="red"
            />

            <StatCard
              title="Net Profit"
              value={money(summary.netProfit)}
              subtitle={`${Number(summary.netMargin || 0).toFixed(1)}% net margin`}
              tone="maroon"
            />

          </div>

          {/* CASH / RECEIVABLES */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <StatCard
              title="Paid / Collections"
              value={money(summary.paidAmount)}
              subtitle="Payments received"
              tone="green"
            />

            <StatCard
              title="Unpaid / Receivable"
              value={money(summary.unpaidAmount)}
              subtitle="Outstanding customer balance"
              tone="red"
            />

            <StatCard
              title="Pending Orders"
              value={summary.pendingOrders.toLocaleString()}
              subtitle="Orders awaiting processing"
            />

            <StatCard
              title="Pending Payments"
              value={summary.pendingPayments.toLocaleString()}
              subtitle="Payment records pending"
            />

          </div>

          {/* INCOME STATEMENT + CASH POSITION */}
          <div className="grid gap-6 lg:grid-cols-2">

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-[#3F3437]">
                    Income Statement
                  </h3>

                  <p className="text-xs text-slate-500">
                    {period}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4 text-sm">

                <div className="flex justify-between">
                  <span className="text-slate-600">
                    Product Revenue
                  </span>

                  <b>
                    {money(summary.productRevenue)}
                  </b>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600">
                    Delivery Income
                  </span>

                  <b>
                    {money(summary.deliveryIncome)}
                  </b>
                </div>

                <div className="flex justify-between border-t pt-4">
                  <span className="font-bold">
                    Total Revenue
                  </span>

                  <b>
                    {money(summary.revenue)}
                  </b>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600">
                    Cost of Goods Sold
                  </span>

                  <b className="text-red-600">
                    - {money(summary.cogs)}
                  </b>
                </div>

                <div className="flex justify-between border-t pt-4">
                  <span className="font-black">
                    Gross Profit
                  </span>

                  <b className="text-green-700">
                    {money(summary.grossProfit)}
                  </b>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600">
                    Operating Expenses
                  </span>

                  <b className="text-red-600">
                    - {money(summary.expenses)}
                  </b>
                </div>

                <div className="flex justify-between border-t-2 border-[#800020] pt-4 text-lg">
                  <span className="font-black">
                    NET PROFIT
                  </span>

                  <b
                    className={
                      summary.netProfit >= 0
                        ? "text-green-700"
                        : "text-red-600"
                    }
                  >
                    {money(summary.netProfit)}
                  </b>
                </div>

              </div>
            </div>

            {/* STOCK */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <h3 className="text-xl font-black text-[#3F3437]">
                Inventory Valuation
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Current stock value
              </p>

              <div className="mt-6 space-y-5">

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Cost Value
                  </p>

                  <p className="mt-1 text-xl font-black">
                    {money(summary.stockCostValue)}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Selling Value
                  </p>

                  <p className="mt-1 text-xl font-black text-green-700">
                    {money(summary.stockSellingValue)}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">

                  <div className="rounded-xl border p-3 text-center">
                    <p className="text-xs text-slate-500">
                      Products
                    </p>

                    <p className="mt-1 text-lg font-black">
                      {summary.products}
                    </p>
                  </div>

                  <div className="rounded-xl border p-3 text-center">
                    <p className="text-xs text-slate-500">
                      Low Stock
                    </p>

                    <p className="mt-1 text-lg font-black text-orange-600">
                      {summary.lowStock}
                    </p>
                  </div>

                  <div className="rounded-xl border p-3 text-center">
                    <p className="text-xs text-slate-500">
                      Out of Stock
                    </p>

                    <p className="mt-1 text-lg font-black text-red-600">
                      {summary.outOfStock}
                    </p>
                  </div>

                </div>

              </div>
            </div>

          </div>

          {/* PAYMENT METHODS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h3 className="text-xl font-black text-[#3F3437]">
              Payment Methods
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Collections received during the selected period
            </p>

            {Object.keys(summary.paymentMethods || {}).length === 0 ? (

              <div className="mt-5 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                No payments recorded for this period.
              </div>

            ) : (

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                {Object.entries(summary.paymentMethods).map(
                  ([method, amount]) => (
                    <div
                      key={method}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {method}
                      </p>

                      <p className="mt-1 text-lg font-black">
                        {money(amount)}
                      </p>
                    </div>
                  )
                )}

              </div>
            )}

          </div>


          {/* EXPENSES MANAGEMENT */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h3 className="text-xl font-black text-[#3F3437]">
                  Expenses Management
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Record, review and manage business expenses.
                </p>
              </div>

              <button
                onClick={() => {
                  if (showExpenseForm) {
                    resetExpenseForm();
                  } else {
                    setEditingExpense(null);
                    setExpenseForm({
                      title: "",
                      amount: "",
                      category: "Other",
                      expense_date: new Date().toISOString().slice(0, 10),
                      notes: "",
                    });
                    setShowExpenseForm(true);
                  }
                }}
                className="rounded-xl bg-[#800020] px-5 py-3 text-sm font-bold text-white hover:opacity-90"
              >
                {showExpenseForm ? "Cancel" : "+ Add Expense"}
              </button>

            </div>

            {/* EXPENSE FORM */}
            {showExpenseForm && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">

                <div className="mb-5">
                  <h4 className="font-black text-[#3F3437]">
                    {editingExpense ? "Edit Expense" : "Add New Expense"}
                  </h4>

                  <p className="mt-1 text-xs text-slate-500">
                    Enter the expense details below.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-600">
                      Expense Title
                    </label>

                    <input
                      value={expenseForm.title}
                      onChange={(e) =>
                        setExpenseForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="e.g. Facebook Ads"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#800020]"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-600">
                      Category
                    </label>

                    <select
                      value={expenseForm.category}
                      onChange={(e) =>
                        setExpenseForm((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#800020]"
                    >
                      {EXPENSE_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-600">
                      Date
                    </label>

                    <input
                      type="date"
                      value={expenseForm.expense_date}
                      onChange={(e) =>
                        setExpenseForm((prev) => ({
                          ...prev,
                          expense_date: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#800020]"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-600">
                      Amount (TZS)
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={expenseForm.amount}
                      onChange={(e) =>
                        setExpenseForm((prev) => ({
                          ...prev,
                          amount: e.target.value,
                        }))
                      }
                      placeholder="0"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#800020]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-bold text-slate-600">
                      Notes
                    </label>

                    <textarea
                      value={expenseForm.notes}
                      onChange={(e) =>
                        setExpenseForm((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      rows={3}
                      placeholder="Optional notes..."
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#800020]"
                    />
                  </div>

                </div>

                <div className="mt-5 flex flex-wrap gap-3">

                  <button
                    onClick={saveExpense}
                    disabled={expenseSaving}
                    className="rounded-xl bg-[#800020] px-6 py-3 text-sm font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {expenseSaving
                      ? "Saving..."
                      : editingExpense
                        ? "Update Expense"
                        : "Save Expense"}
                  </button>

                  <button
                    onClick={resetExpenseForm}
                    disabled={expenseSaving}
                    className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>

                </div>

              </div>
            )}

            {/* EXPENSE SUMMARY */}
            <div className="mt-6 grid gap-4 md:grid-cols-2">

              <div className="rounded-xl bg-slate-50 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Selected Period Expenses
                </p>

                <p className="mt-2 text-2xl font-black text-[#800020]">
                  {money(summary.expenses)}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  All Recorded Expenses
                </p>

                <p className="mt-2 text-2xl font-black">
                  {money(
                    expenses.reduce(
                      (total, expense) => total + Number(expense.amount || 0),
                      0
                    )
                  )}
                </p>
              </div>

            </div>

            {/* CATEGORY TOTALS */}
            <div className="mt-6">

              <div className="mb-3">
                <h4 className="font-black text-[#3F3437]">
                  Category Totals
                </h4>

                <p className="mt-1 text-xs text-slate-500">
                  Based on all recorded expenses.
                </p>
              </div>

              {expenses.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                  No expense records yet.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                  {Object.entries(
                    expenses.reduce<Record<string, number>>(
                      (totals, expense) => {
                        const category = expense.category || "Other";

                        totals[category] =
                          (totals[category] || 0) +
                          Number(expense.amount || 0);

                        return totals;
                      },
                      {}
                    )
                  ).map(([category, amount]) => (
                    <div
                      key={category}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {category}
                      </p>

                      <p className="mt-2 text-lg font-black">
                        {money(amount)}
                      </p>
                    </div>
                  ))}

                </div>
              )}

            </div>

            {/* EXPENSE HISTORY */}
            <div className="mt-8">

              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-black text-[#3F3437]">
                    Expense History
                  </h4>

                  <p className="mt-1 text-xs text-slate-500">
                    All recorded business expenses.
                  </p>
                </div>

                {expenseLoading && (
                  <span className="text-xs font-bold text-slate-500">
                    Loading...
                  </span>
                )}
              </div>

              {expenses.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">
                  No expense records found.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">

                  <table className="min-w-full text-sm">

                    <thead className="bg-slate-50">
                      <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Title</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3">Notes</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">

                      {expenses.map((expense) => (
                        <tr key={expense.id} className="hover:bg-slate-50">

                          <td className="whitespace-nowrap px-4 py-3 font-medium">
                            {expense.expense_date}
                          </td>

                          <td className="px-4 py-3 font-bold text-[#3F3437]">
                            {expense.title}
                          </td>

                          <td className="px-4 py-3">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                              {expense.category || "Other"}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-right font-black">
                            {money(expense.amount)}
                          </td>

                          <td className="max-w-[240px] px-4 py-3 text-slate-500">
                            {expense.notes || "—"}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-right">

                            <div className="flex justify-end gap-2">

                              <button
                                onClick={() => startEditExpense(expense)}
                                disabled={expenseSaving}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => deleteExpense(expense.id)}
                                disabled={expenseSaving}
                                className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                              >
                                Delete
                              </button>

                            </div>

                          </td>

                        </tr>
                      ))}

                    </tbody>

                  </table>

                </div>
              )}

            </div>

          </div>


          {/* PAYMENTS / COLLECTIONS MANAGEMENT */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h3 className="text-xl font-black text-[#3F3437]">
                  Payments & Collections
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Record and manage customer payments and collections.
                </p>
              </div>

              <button
                onClick={() => {
                  if (showPaymentForm) {
                    resetPaymentForm();
                  } else {
                    setEditingPayment(null);
                    setPaymentForm({
                      order_id: "",
                      amount: "",
                      payment_method: "Cash",
                      payment_status: "Paid",
                      transaction_ref: "",
                    });
                    setShowPaymentForm(true);
                  }
                }}
                className="rounded-xl bg-[#800020] px-5 py-3 text-sm font-bold text-white hover:opacity-90"
              >
                {showPaymentForm ? "Cancel" : "+ Record Payment"}
              </button>

            </div>

            {/* COLLECTION SUMMARY */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Collected
                </p>
                <p className="mt-2 text-xl font-black text-green-700">
                  {money(summary.paidAmount)}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Receivable
                </p>
                <p className="mt-2 text-xl font-black text-red-600">
                  {money(summary.unpaidAmount)}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Payments Recorded
                </p>
                <p className="mt-2 text-xl font-black">
                  {payments.length}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Pending Payments
                </p>
                <p className="mt-2 text-xl font-black text-orange-600">
                  {summary.pendingPayments}
                </p>
              </div>

            </div>

            {/* PAYMENT FORM */}
            {showPaymentForm && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">

                <div className="mb-5">
                  <h4 className="font-black text-[#3F3437]">
                    {editingPayment ? "Edit Payment" : "Record New Payment"}
                  </h4>

                  <p className="mt-1 text-xs text-slate-500">
                    Record the amount actually received from the customer.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-bold text-slate-600">
                      Order
                    </label>

                    <select
                      value={paymentForm.order_id}
                      disabled={!!editingPayment}
                      onChange={(e) => {
                        const order = paymentOrders.find(
                          (item) => String(item.id) === e.target.value
                        );

                        setPaymentForm((prev) => ({
                          ...prev,
                          order_id: e.target.value,
                          amount: order ? String(order.total) : prev.amount,
                        }));
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#800020] disabled:bg-slate-100"
                    >
                      <option value="">Select order</option>

                      {paymentOrders.map((order) => (
                        <option key={order.id} value={order.id}>
                          {order.order_number} — {order.customer_name || "Customer"} — {money(order.total)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-600">
                      Amount Paid (TZS)
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={paymentForm.amount}
                      onChange={(e) =>
                        setPaymentForm((prev) => ({
                          ...prev,
                          amount: e.target.value,
                        }))
                      }
                      placeholder="0"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#800020]"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-600">
                      Payment Method
                    </label>

                    <select
                      value={paymentForm.payment_method}
                      onChange={(e) =>
                        setPaymentForm((prev) => ({
                          ...prev,
                          payment_method: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#800020]"
                    >
                      {PAYMENT_METHODS.map((method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-600">
                      Payment Status
                    </label>

                    <select
                      value={paymentForm.payment_status}
                      onChange={(e) =>
                        setPaymentForm((prev) => ({
                          ...prev,
                          payment_status: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#800020]"
                    >
                      {PAYMENT_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-600">
                      Transaction Reference
                    </label>

                    <input
                      value={paymentForm.transaction_ref}
                      onChange={(e) =>
                        setPaymentForm((prev) => ({
                          ...prev,
                          transaction_ref: e.target.value,
                        }))
                      }
                      placeholder="e.g. MPESA transaction ID"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#800020]"
                    />
                  </div>

                </div>

                <div className="mt-5 flex flex-wrap gap-3">

                  <button
                    onClick={savePayment}
                    disabled={paymentSaving}
                    className="rounded-xl bg-[#800020] px-6 py-3 text-sm font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {paymentSaving
                      ? "Saving..."
                      : editingPayment
                        ? "Update Payment"
                        : "Save Payment"}
                  </button>

                  <button
                    onClick={resetPaymentForm}
                    disabled={paymentSaving}
                    className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>

                </div>

              </div>
            )}

            {/* COLLECTIONS BY METHOD */}
            <div className="mt-6">

              <h4 className="font-black text-[#3F3437]">
                Collections by Payment Method
              </h4>

              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                {Object.entries(summary.paymentMethods || {}).map(
                  ([method, amount]) => (
                    <div
                      key={method}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {method}
                      </p>

                      <p className="mt-2 text-lg font-black">
                        {money(amount)}
                      </p>
                    </div>
                  )
                )}

                {Object.keys(summary.paymentMethods || {}).length === 0 && (
                  <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500 sm:col-span-2 lg:col-span-4">
                    No collections recorded for the selected period.
                  </div>
                )}

              </div>

            </div>

            {/* PAYMENT HISTORY */}
            <div className="mt-8">

              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-black text-[#3F3437]">
                    Payment History
                  </h4>

                  <p className="mt-1 text-xs text-slate-500">
                    All recorded customer payments.
                  </p>
                </div>

                {paymentLoading && (
                  <span className="text-xs font-bold text-slate-500">
                    Loading...
                  </span>
                )}
              </div>

              {payments.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">
                  No payment records found.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">

                  <table className="min-w-full text-sm">

                    <thead className="bg-slate-50">
                      <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Order</th>
                        <th className="px-4 py-3">Method</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Reference</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">

                      {payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-slate-50">

                          <td className="whitespace-nowrap px-4 py-3">
                            {new Date(payment.created_at).toLocaleString()}
                          </td>

                          <td className="px-4 py-3 font-bold text-[#3F3437]">
                            {payment.order_number}
                          </td>

                          <td className="px-4 py-3">
                            {payment.payment_method || "Cash"}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-right font-black">
                            {money(payment.amount)}
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={
                                payment.payment_status === "Paid"
                                  ? "rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700"
                                  : "rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700"
                              }
                            >
                              {payment.payment_status}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-slate-500">
                            {payment.transaction_ref || "—"}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-right">

                            <div className="flex justify-end gap-2">

                              <button
                                onClick={() => startEditPayment(payment)}
                                disabled={paymentSaving}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => deletePayment(payment.id)}
                                disabled={paymentSaving}
                                className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                              >
                                Delete
                              </button>

                            </div>

                          </td>

                        </tr>
                      ))}

                    </tbody>

                  </table>

                </div>
              )}

            </div>

          </div>

          {/* ACCOUNTING CONTROLS */}
          <div className="grid gap-6 lg:grid-cols-2">

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <h3 className="text-xl font-black text-[#3F3437]">
                Accounting Controls
              </h3>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">
                    Orders
                  </p>

                  <p className="text-xl font-black">
                    {summary.orders}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">
                    Receivables
                  </p>

                  <p className="text-xl font-black text-red-600">
                    {money(summary.unpaidAmount)}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">
                    Gross Margin
                  </p>

                  <p className="text-xl font-black text-green-700">
                    {Number(summary.grossMargin || 0).toFixed(2)}%
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">
                    Net Margin
                  </p>

                  <p className="text-xl font-black text-[#800020]">
                    {Number(summary.netMargin || 0).toFixed(2)}%
                  </p>
                </div>

              </div>

            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <h3 className="text-xl font-black text-[#3F3437]">
                Reports
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Detailed financial reports can be generated from the Reports module.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">

                <button
                  onClick={() => window.print()}
                  className="rounded-xl bg-[#800020] px-5 py-3 text-sm font-bold text-white hover:opacity-90"
                >
                  Print Report
                </button>

                <button
                  onClick={() => window.location.href = "/admin-new"}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Back to Admin
                </button>

              </div>

            </div>

          </div>

        </>
      )}

    </section>
  );
}
