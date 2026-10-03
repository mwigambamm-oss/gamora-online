"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const router = useRouter();

  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        setLoading(false);
        router.replace("/login");
        return;
      }

      setUserEmail(user.email ?? "");
      setLoading(false);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      if (!session?.user) {
        router.replace("/login");
        return;
      }

      setUserEmail(session.user.email ?? "");
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      return;
    }

    router.replace("/login");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-5">
        <div className="mx-auto max-w-md rounded-xl border bg-white p-6">
          <p className="text-sm text-slate-500">Loading account...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <a href="/" className="text-sm font-medium">
            GAMORA <span className="text-sky-700">ONLINE</span>
          </a>

          <a href="/" className="text-xs text-sky-700">
            ← Dukani
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-md px-4 py-8">
        <h1 className="text-xl font-medium text-slate-800">
          Account
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Akaunti yako ya GAMORA ONLINE.
        </p>

        <div className="mt-6 rounded-xl border bg-white p-5">
          <div>
            <h2 className="text-sm font-medium text-slate-800">
              Karibu kwenye akaunti yako
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              {userEmail}
            </p>

            <div className="mt-5 space-y-2 text-xs text-slate-600">
              <a
                href="/orders"
                className="block rounded-lg border px-3 py-3 hover:bg-slate-50"
              >
                📦 Oda Zangu
              </a>

              <a
                href="/wishlist"
                className="block rounded-lg border px-3 py-3 hover:bg-slate-50"
              >
                ♡ Orodha ya Matamanio
              </a>

              <div className="rounded-lg border px-3 py-3">
                👤 Taarifa Zangu
              </div>
            </div>

            <button
              onClick={logout}
              className="mt-5 w-full rounded-lg bg-red-600 px-4 py-3 text-xs font-medium text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
