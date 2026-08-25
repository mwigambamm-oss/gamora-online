"use client";

import { useEffect, useState } from "react";

type Expense = {
  id: number;
  title: string;
  amount: number;
  category: string;
  expense_date: string;
  notes?: string;
};

const money = (n: number) =>
  `TZS ${Number(n || 0).toLocaleString()}`;

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Other");
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const response = await fetch("/api/accounting/expenses", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load expenses");
      }

      setExpenses(result.expenses || []);
    } catch (error) {
      console.error(error);
      alert("Failed to load expenses.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveExpense() {
    if (!title.trim() || !amount || Number(amount) <= 0) {
      alert("Enter expense title and valid amount.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/accounting/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          amount: Number(amount),
          category,
          expense_date: date,
          notes,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to save expense");
      }

      alert("✅ Expense recorded.");

      setTitle("");
      setAmount("");
      setNotes("");

      await load();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to save expense.");
    } finally {
      setSaving(false);
    }
  }

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0
  );

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-white md:p-8">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-orange-400">
            GAMORA ONLINE
          </p>

          <h1 className="mt-1 text-3xl font-black">
            Business Expenses
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Record operating costs so net profit remains accurate.
          </p>
        </div>

        <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.06] p-6">

          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-black">
              Add Expense
            </h2>

            <div className="text-right">
              <p className="text-xs text-slate-500">
                Total Recorded
              </p>

              <p className="text-xl font-black text-red-400">
                {money(totalExpenses)}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-5">

            <input
              placeholder="Expense title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none"
            />

            <input
              type="number"
              min="1"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none"
            >
              <option>Transport</option>
              <option>Advertising</option>
              <option>Packaging</option>
              <option>Rent</option>
              <option>Internet</option>
              <option>Salary</option>
              <option>Utilities</option>
              <option>Bank Charges</option>
              <option>Other</option>
            </select>

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none"
            />

            <button
              onClick={saveExpense}
              disabled={saving}
              className="rounded-xl bg-orange-600 px-5 py-3 font-black hover:bg-orange-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "💸 Add Expense"}
            </button>

          </div>

          <textarea
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-4 min-h-24 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none"
          />
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">

          <h2 className="mb-5 text-xl font-black">
            Expense History
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left">

              <thead>
                <tr className="border-b border-white/10 text-xs uppercase text-slate-500">
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Expense</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3">Amount</th>
                  <th className="px-3 py-3">Notes</th>
                </tr>
              </thead>

              <tbody>
                {expenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="border-b border-white/5"
                  >
                    <td className="px-3 py-4 text-slate-400">
                      {expense.expense_date}
                    </td>

                    <td className="px-3 py-4 font-bold">
                      {expense.title}
                    </td>

                    <td className="px-3 py-4">
                      {expense.category}
                    </td>

                    <td className="px-3 py-4 font-black text-red-400">
                      {money(expense.amount)}
                    </td>

                    <td className="px-3 py-4 text-sm text-slate-500">
                      {expense.notes || "-"}
                    </td>
                  </tr>
                ))}

                {!expenses.length && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-10 text-center text-slate-500"
                    >
                      No expenses recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>

        </section>

      </div>
    </main>
  );
}
