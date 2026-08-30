"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const router = useRouter();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to change password.");
        return;
      }

      setSuccess("Password changed successfully.");

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        router.replace("/admin");
      }, 1500);
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-lg">

        <div className="mb-6">
          <a
            href="/admin"
            className="font-bold text-sky-700 hover:underline"
          >
            ← Back to Dashboard
          </a>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-xl">

          <div className="mb-8 text-center">

            <img
              src="/admin-picture.jpeg"
              alt="Admin"
              className="mx-auto h-24 w-24 rounded-full border-4 border-orange-500 object-cover shadow-lg"
            />

            <h1 className="mt-5 text-2xl font-black text-slate-900">
              Change Password
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Update your GAMORA ONLINE admin password
            </p>

          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Current Password
              </label>

              <input
                type="password"
                value={oldPassword}
                onChange={(event) =>
                  setOldPassword(event.target.value)
                }
                placeholder="Enter current password"
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
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
                required
                minLength={8}
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
                required
                minLength={8}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-600">
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
                : "🔐 Change Password"}
            </button>

          </form>

        </div>

      </div>
    </main>
  );
}
