"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function RecoverAdminPasswordPage() {
  const router = useRouter();

  const [username, setUsername] = useState("admin");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (newPassword.length < 8) {
      setError(
        "New password must be at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/admin/recover-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            recoveryCode,
            newPassword,
            confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Unable to change admin password."
        );
        return;
      }

      setSuccess(
        "Password changed successfully. Redirecting to login..."
      );

      setRecoveryCode("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        router.replace("/admin/login");
      }, 1800);
    } catch {
      setError(
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">

        <div className="mb-8 text-center">
          <img
            src="/gamora-logo.png"
            alt="GAMORA ONLINE"
            className="mx-auto h-20 w-auto object-contain"
          />

          <h1 className="mt-5 text-2xl font-black text-slate-900">
            Recover Admin Password
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Use your admin recovery code to create
            a new password.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Username
            </label>

            <input
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              placeholder="Enter admin username"
              autoComplete="username"
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Recovery Code
            </label>

            <input
              type="password"
              value={recoveryCode}
              onChange={(event) =>
                setRecoveryCode(event.target.value)
              }
              placeholder="Enter recovery code"
              autoComplete="off"
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              New Password
            </label>

            <input
              type="password"
              value={newPassword}
              onChange={(event) =>
                setNewPassword(event.target.value)
              }
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              minLength={8}
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Confirm New Password
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              placeholder="Repeat new password"
              autoComplete="new-password"
              minLength={8}
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-orange-600 px-6 py-4 font-black text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading
              ? "Changing Password..."
              : "🔐 Change Admin Password"}
          </button>

        </form>

        <a
          href="/admin/login"
          className="mt-6 block text-center text-sm font-bold text-sky-700 hover:underline"
        >
          ← Back to Admin Login
        </a>

      </div>
    </main>
  );
}
