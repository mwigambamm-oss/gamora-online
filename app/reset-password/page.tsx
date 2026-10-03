"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        event === "PASSWORD_RECOVERY" ||
        session
      ) {
        setReady(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function updatePassword() {
    setError("");
    setMessage("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Password updated successfully.");

    setTimeout(() => {
      router.replace("/login");
    }, 1200);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-5">
      <div className="mx-auto max-w-md rounded-xl border bg-white p-6">
        <h1 className="text-lg font-medium text-slate-800">
          Reset Password
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Weka password mpya ya akaunti yako ya GAMORA ONLINE.
        </p>

        {!ready ? (
          <div className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
            Verifying password reset link...
          </div>
        ) : (
          <>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              autoComplete="new-password"
              className="mt-5 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-sky-600"
            />

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              autoComplete="new-password"
              className="mt-3 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-sky-600"
            />

            {error && (
              <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">
                {error}
              </p>
            )}

            {message && (
              <p className="mt-3 rounded-lg bg-green-50 p-3 text-xs text-green-700">
                {message}
              </p>
            )}

            <button
              type="button"
              onClick={updatePassword}
              disabled={saving}
              className="mt-4 w-full rounded-lg bg-sky-700 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {saving ? "Updating..." : "Update Password"}
            </button>
          </>
        )}

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
