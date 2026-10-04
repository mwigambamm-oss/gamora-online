"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Mode = "login" | "register" | "forgot";

export default function AccountPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (user) {
        setLoggedIn(true);
        setFirstName(user.user_metadata?.first_name ?? "");
        setLastName(user.user_metadata?.last_name ?? "");
        setEmail(user.email ?? "");
      }

      setLoading(false);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      if (session?.user) {
        setLoggedIn(true);
        setFirstName(session.user.user_metadata?.first_name ?? "");
        setLastName(session.user.user_metadata?.last_name ?? "");
        setEmail(session.user.email ?? "");
      } else {
        setLoggedIn(false);
        setFirstName("");
        setLastName("");
        setEmail("");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (mode === "register") {
      if (
        !cleanFirstName ||
        !cleanLastName ||
        !cleanEmail ||
        !password ||
        !confirmPassword
      ) {
        setMessage("Please fill in all fields.");
        return;
      }

      if (password.length < 6) {
        setMessage("Password must be at least 6 characters.");
        return;
      }

      if (password !== confirmPassword) {
        setMessage("Passwords do not match.");
        return;
      }

      setSubmitting(true);

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            first_name: cleanFirstName,
            last_name: cleanLastName,
          },
        },
      });

      setSubmitting(false);

      if (error) {
        setMessage(error.message);
        return;
      }

      if (data.session) {
        router.replace("/profile");
        return;
      }

      setMessage(
        "Account created successfully. Check your email to confirm your account, then login."
      );
      setMode("login");
      setPassword("");
      setConfirmPassword("");
      return;
    }

    if (mode === "login") {
      if (!cleanEmail || !password) {
        setMessage("Please enter your email and password.");
        return;
      }

      setSubmitting(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      setSubmitting(false);

      if (error) {
        setMessage(
          error.message === "Invalid login credentials"
            ? "Email or password is incorrect."
            : error.message
        );
        return;
      }

      router.replace("/profile");
      return;
    }

    if (!cleanEmail) {
      setMessage("Please enter your email address.");
      return;
    }

    setSubmitting(true);

    const redirectTo = `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo,
    });

    setSubmitting(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(
      "Password reset link sent. Check your email and follow the link to create a new password."
    );
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setMessage(error.message);
      return;
    }

    setLoggedIn(false);
    router.push("/");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-md rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">Loading account...</p>
        </div>
      </main>
    );
  }

  if (loggedIn) {
    const fullName = [firstName, lastName].filter(Boolean).join(" ");
    const initial = (
      firstName.trim().charAt(0) ||
      email.trim().charAt(0) ||
      "G"
    ).toUpperCase();

    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-md rounded-xl border bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-700 text-lg font-semibold text-white">
              {initial}
            </div>

            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                {fullName || "My GAMORA"}
              </h1>

              <p className="mt-1 text-xs text-slate-500">
                {email}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <button
              type="button"
              onClick={() => router.push("/profile")}
              className="w-full rounded-lg border px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              👤 My Profile
            </button>

            <button
              type="button"
              onClick={() => router.push("/orders")}
              className="w-full rounded-lg border px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              📦 My Orders
            </button>

            <button
              type="button"
              onClick={() => router.push("/wishlist")}
              className="w-full rounded-lg border px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              ♡ My Wishlist
            </button>
          </div>

          <button
            type="button"
            onClick={logout}
            className="mt-5 w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white"
          >
            Logout
          </button>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-4 block w-full text-center text-xs text-slate-500 hover:text-slate-700"
          >
            ← Back to Shop
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-md rounded-xl border bg-white p-5">
        <div className="text-center">
          <a href="/" className="text-lg font-semibold text-slate-900">
            GAMORA <span className="text-sky-700">ONLINE</span>
          </a>

          <h1 className="mt-6 text-xl font-medium text-slate-800">
            {mode === "login"
              ? "Login"
              : mode === "register"
                ? "Create Account"
                : "Recover Password"}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {mode === "login"
              ? "Login to your GAMORA ONLINE account."
              : mode === "register"
                ? "Create your GAMORA ONLINE account and start shopping."
                : "Enter your email to receive a password reset link."}
          </p>
        </div>

        <form onSubmit={submit} className="mt-6">
          {mode === "register" && (
            <>
              <label className="text-xs font-medium text-slate-700">
                First Name
              </label>

              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                autoComplete="given-name"
                className="mt-2 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-sky-600"
              />

              <label className="mt-4 block text-xs font-medium text-slate-700">
                Last Name
              </label>

              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                autoComplete="family-name"
                className="mt-2 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-sky-600"
              />
            </>
          )}

          <label className="mt-4 block text-xs font-medium text-slate-700">
            Email Address
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            autoComplete="email"
            required
            className="mt-2 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-sky-600"
          />

          {mode !== "forgot" && (
            <>
              <label className="mt-4 block text-xs font-medium text-slate-700">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete={
                  mode === "register" ? "new-password" : "current-password"
                }
                className="mt-2 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-sky-600"
              />
            </>
          )}

          {mode === "register" && (
            <>
              <label className="mt-4 block text-xs font-medium text-slate-700">
                Confirm Password
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                autoComplete="new-password"
                className="mt-2 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-sky-600"
              />
            </>
          )}

          {message && (
            <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-5 w-full rounded-lg bg-sky-700 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting
              ? mode === "login"
                ? "Logging in..."
                : mode === "register"
                  ? "Creating Account..."
                  : "Sending..."
              : mode === "login"
                ? "Login"
                : mode === "register"
                  ? "Create Account"
                  : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-5 border-t pt-5 text-center">
          <button
            type="button"
            onClick={() => {
              setMessage("");
              setMode("login");
            }}
            className="block w-full py-1 text-xs text-sky-700 hover:underline"
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => {
              setMessage("");
              setMode("register");
            }}
            className="mt-2 block w-full py-1 text-xs text-sky-700 hover:underline"
          >
            Create Account
          </button>

          <button
            type="button"
            onClick={() => {
              setMessage("");
              setMode("forgot");
            }}
            className="mt-2 block w-full py-1 text-xs text-sky-700 hover:underline"
          >
            Forgot Password
          </button>
        </div>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-5 block w-full text-center text-xs text-slate-500 hover:text-slate-700"
        >
          ← Back to Shop
        </button>
      </div>
    </main>
  );
}
