"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [storeName, setStoreName] = useState("GAMORA ONLINE");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    setStoreName(
      localStorage.getItem("gamora_store_name") ||
        "GAMORA ONLINE"
    );

    setPhone(
      localStorage.getItem("gamora_store_phone") || ""
    );

    setEmail(
      localStorage.getItem("gamora_store_email") || ""
    );
  }, []);

  function saveSettings() {
    localStorage.setItem("gamora_store_name", storeName);
    localStorage.setItem("gamora_store_phone", phone);
    localStorage.setItem("gamora_store_email", email);

    alert("Settings saved successfully!");
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="border-b bg-white px-6 py-5 shadow-sm">
        <a href="/admin" className="font-bold text-orange-600">
          ← Back to Dashboard
        </a>

        <h1 className="mt-2 text-2xl font-black">
          Settings
        </h1>

        <p className="text-sm text-gray-500">
          Manage your store settings
        </p>
      </header>

      <div className="mx-auto max-w-4xl p-6">
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">
            Store Information
          </h2>

          <div className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold">
                Store Name
              </label>

              <input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full rounded-lg border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">
                Phone Number
              </label>

              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Example: 0712345678"
                className="w-full rounded-lg border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="store@example.com"
                className="w-full rounded-lg border px-4 py-3"
              />
            </div>

            <button
              onClick={saveSettings}
              className="rounded-lg bg-orange-600 px-6 py-3 font-bold text-white hover:bg-orange-700"
            >
              Save Settings
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
