"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminNewLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin-new/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Login failed.");
        return;
      }

      window.location.href = "/admin-new";
    } catch {
      setError("Unable to connect to the authentication service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">

        <div className="mb-8 text-center">
          <img
            src="/gamora-logo.png"
            alt="GAMORA ONLINE"
            className="mx-auto h-20 w-auto object-contain"
          />

          <h1 className="mt-5 text-2xl font-black text-slate-900">
            Admin Portal
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Sign in to manage GAMORA ONLINE
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter admin email"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-sky-700 px-6 py-4 font-black text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? "Signing in..." : "🔐 Sign In"}
          </button>

        </form>

        <a
          href="/"
          className="mt-6 block text-center text-sm font-bold text-sky-700 hover:underline"
        >
          ← Back to GAMORA ONLINE
        </a>

      </div>
    </main>
  );
}
