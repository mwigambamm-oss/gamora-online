"use client";

import { useEffect, useState } from "react";

export default function SettingsModule() {
  const [storeName, setStoreName] = useState("GAMORA ONLINE");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [currency, setCurrency] = useState("TZS");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setStoreName(
      localStorage.getItem("gamora_store_name") || "GAMORA ONLINE"
    );

    setPhone(
      localStorage.getItem("gamora_store_phone") || ""
    );

    setEmail(
      localStorage.getItem("gamora_store_email") || ""
    );

    setCurrency(
      localStorage.getItem("gamora_currency") || "TZS"
    );
  }, []);

  function saveSettings() {
    localStorage.setItem("gamora_store_name", storeName);
    localStorage.setItem("gamora_store_phone", phone);
    localStorage.setItem("gamora_store_email", email);
    localStorage.setItem("gamora_currency", currency);

    setSaved(true);

    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-[#1E293B]">
          Settings
        </h2>
        <p className="mt-1 text-sm text-[#64748B]">
          Manage GAMORA ONLINE business control preferences.
        </p>
      </div>

      <div className="rounded-2xl border border-[#CBD5E1] bg-[#E2E8F0] p-6 shadow-sm">
        <h3 className="text-lg font-black">
          Store Information
        </h3>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <label className="text-sm font-bold">
              Store Name
            </label>
            <input
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[#CBD5E1] px-4 py-3 outline-none focus:border-[#172554]"
            />
          </div>

          <div>
            <label className="text-sm font-bold">
              Phone Number
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0712345678"
              className="mt-2 w-full rounded-xl border border-[#CBD5E1] px-4 py-3 outline-none focus:border-[#172554]"
            />
          </div>

          <div>
            <label className="text-sm font-bold">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="store@example.com"
              className="mt-2 w-full rounded-xl border border-[#CBD5E1] px-4 py-3 outline-none focus:border-[#172554]"
            />
          </div>

          <div>
            <label className="text-sm font-bold">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[#CBD5E1] px-4 py-3 outline-none focus:border-[#172554]"
            >
              <option value="TZS">TZS — Tanzanian Shilling</option>
              <option value="USD">USD — US Dollar</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            onClick={saveSettings}
            className="rounded-xl bg-[#172033] px-6 py-3 font-bold text-white hover:bg-[#1E3A8A]"
          >
            Save Settings
          </button>

          {saved && (
            <span className="text-sm font-bold text-[#172554]">
              ✓ Settings saved successfully
            </span>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-[#CBD5E1] bg-[#F8FAF9] p-6">
        <h3 className="font-black">Security</h3>
        <p className="mt-1 text-sm text-[#64748B]">
          Update your administrator password securely.
        </p>

        <a
          href="/recover-admin-password"
          className="mt-4 inline-flex rounded-xl border border-[#172554] px-5 py-3 text-sm font-bold text-[#172554] hover:bg-[#172033] hover:text-white"
        >
          🔐 Change Password
        </a>
      </div>
    </section>
  );
}
