"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");

    const cleanEmail = email.trim();

    if (!cleanEmail || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (data.session) {
      router.replace("/profile");
      return;
    }

    setMessage(
      "Account created successfully. Check your email to confirm your account, then login."
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-5">
      <div className="mx-auto max-w-md rounded-xl border bg-white p-6">
        <div className="text-center">
          <a href="/" className="text-lg font-semibold text-slate-900">
            GAMORA <span className="text-sky-700">ONLINE</span>
          </a>

          <h1 className="mt-6 text-xl font-medium text-slate-800">
            Create Account
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Jisajili GAMORA ONLINE na anza kufanya shopping.
          </p>
        </div>

        <form onSubmit={register} className="mt-6">
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
            placeholder="At least 6 characters"
            autoComplete="new-password"
            className="mt-2 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-sky-600"
          />

          <label className="mt-4 block text-xs font-medium text-slate-700">
            Confirm Password
          </label>

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat password"
            autoComplete="new-password"
            className="mt-2 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-sky-600"
          />

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-xs leading-5 text-red-700">
              {error}
            </p>
          )}

          {message && (
            <p className="mt-4 rounded-lg bg-green-50 p-3 text-xs leading-5 text-green-700">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-lg bg-sky-700 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="mt-5 border-t pt-5 text-center">
          <p className="text-xs text-slate-500">
            Already have an account?
          </p>

          <a
            href="/login"
            className="mt-2 inline-block text-sm font-medium text-sky-700 hover:underline"
          >
            Login
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
