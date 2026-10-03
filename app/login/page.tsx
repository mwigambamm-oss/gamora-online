"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    setLoading(false);

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "Email or password is incorrect."
          : error.message
      );
      return;
    }

    router.replace("/profile");
  }

  return (
    <main className="min-h-screen bg-slate-50 p-5">
      <div className="mx-auto max-w-md rounded-xl border bg-white p-6">
        <div className="text-center">
          <a href="/" className="text-lg font-semibold text-slate-900">
            GAMORA <span className="text-sky-700">ONLINE</span>
          </a>

          <h1 className="mt-6 text-xl font-medium text-slate-800">
            Login
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Ingia kwenye akaunti yako ya GAMORA ONLINE.
          </p>
        </div>

        <form onSubmit={login} className="mt-6">
          <label className="text-xs font-medium text-slate-700">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            autoComplete="email"
            className="mt-2 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-sky-600"
          />

          <label className="mt-4 block text-xs font-medium text-slate-700">
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            className="mt-2 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-sky-600"
          />

          <div className="mt-2 text-right">
            <a
              href="/recover-password"
              className="text-xs text-sky-700 hover:underline"
            >
              Forgot password?
            </a>
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-xs leading-5 text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-lg bg-sky-700 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-5 border-t pt-5 text-center">
          <p className="text-xs text-slate-500">
            Huna akaunti?
          </p>

          <a
            href="/register"
            className="mt-2 inline-block text-sm font-medium text-sky-700 hover:underline"
          >
            Create Account
          </a>
        </div>

        <a
          href="/"
          className="mt-5 block text-center text-xs text-slate-500 hover:text-slate-700"
        >
          ← Rudi Dukani
        </a>
      </div>
    </main>
  );
}
