"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RecoverPassword() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function sendResetLink() {
    setMessage("");
    setError("");

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    setSending(true);

    const redirectTo =
      `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(
      cleanEmail,
      {
        redirectTo,
      }
    );

    setSending(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage(
      "Password reset link sent. Check your email and follow the link to create a new password."
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-5">
      <div className="mx-auto max-w-md rounded-xl border bg-white p-6">
        <h1 className="text-lg font-medium text-slate-800">
          Recover Password
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Weka email yako ili upate link ya kubadilisha password.
        </p>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          autoComplete="email"
          className="mt-5 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-sky-600"
        />

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">
            {error}
          </p>
        )}

        {message && (
          <p className="mt-3 rounded-lg bg-green-50 p-3 text-xs leading-5 text-green-700">
            {message}
          </p>
        )}

        <button
          type="button"
          onClick={sendResetLink}
          disabled={sending}
          className="mt-4 w-full rounded-lg bg-sky-700 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {sending ? "Sending..." : "Send Reset Link"}
        </button>

        <a
          href="/login"
          className="mt-4 block text-center text-xs text-sky-700"
        >
          Back to Login
        </a>
      </div>
    </main>
  );
}
