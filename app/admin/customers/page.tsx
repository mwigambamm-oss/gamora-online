"use client";

import { useEffect, useState } from "react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("gamora_orders");

      if (saved) {
        const orders = JSON.parse(saved);

        if (Array.isArray(orders)) {
          const names = orders
            .map((order) => order.customer)
            .filter(Boolean);

          setCustomers([...new Set(names)]);
        }
      }
    } catch {
      setCustomers([]);
    }
  }, []);

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="border-b bg-white px-6 py-5 shadow-sm">
        <a href="/admin" className="font-bold text-orange-600">
          ← Back to Dashboard
        </a>

        <h1 className="mt-2 text-2xl font-black">Customers</h1>

        <p className="text-sm text-gray-500">
          Manage your GAMORA ONLINE customers
        </p>
      </header>

      <div className="mx-auto max-w-7xl p-6">
        <div className="rounded-xl bg-white shadow-sm">
          <div className="border-b p-6">
            <h2 className="text-xl font-black">
              Customer List
            </h2>

            <p className="text-sm text-gray-500">
              {customers.length} customer(s)
            </p>
          </div>

          {customers.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-5xl">👥</div>

              <h3 className="mt-4 font-bold">
                No customers yet
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Customers will appear here after placing orders.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {customers.map((customer, index) => (
                <div
                  key={customer}
                  className="flex items-center gap-4 p-5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-600">
                    {index + 1}
                  </div>

                  <div>
                    <p className="font-bold">{customer}</p>
                    <p className="text-xs text-gray-500">
                      GAMORA ONLINE Customer
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
