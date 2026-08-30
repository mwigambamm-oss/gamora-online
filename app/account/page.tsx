"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  async function submit() {
    setMessage("");

    if (mode === "register") {
      const finalEmail = email || `${phone}@gamora.local`;

      const { error } = await supabase.auth.signUp({
        email: finalEmail,
        password,
        options: {
          data: {
            name,
            phone,
          },
        },
      });

      if (error) return setMessage(error.message);

      setMessage("Account imetengenezwa. Unaweza kuingia sasa.");
    }

    if (mode === "login") {
      const loginEmail = identifier.includes("@")
        ? identifier
        : `${identifier}@gamora.local`;

      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (error) return setMessage(error.message);

      router.push("/profile");
    }

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) return setMessage(error.message);

      setMessage("Password reset link imetumwa kwenye email.");
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">

      <div className="mx-auto max-w-md rounded-xl bg-white p-5 shadow-sm">

        <h1 className="text-lg font-medium text-slate-900">
          GAMORA ONLINE Account
        </h1>

        <p className="mt-1 text-xs text-slate-500">
          Login, register au recover password
        </p>


        {mode === "register" && (
          <input
            placeholder="Jina"
            value={name}
            onChange={(e)=>setName(e.target.value)}
            className="mt-4 w-full rounded-lg border p-3 text-sm"
          />
        )}



        {mode === "register" && (
          <input
            placeholder="Namba ya simu"
            value={phone}
            onChange={(e)=>setPhone(e.target.value)}
            className="mt-3 w-full rounded-lg border p-3 text-sm"
          />
        )}

        {mode !== "forgot" && (
          <input
            placeholder="Email (optional)"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            className="mt-4 w-full rounded-lg border p-3 text-sm"
          />
        )}

        {mode === "login" && (
          <input
            placeholder="Email au Namba ya simu"
            value={identifier}
            onChange={(e)=>setIdentifier(e.target.value)}
            className="mt-4 w-full rounded-lg border p-3 text-sm"
          />
        )}


        {mode !== "forgot" && (
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            className="mt-3 w-full rounded-lg border p-3 text-sm"
          />
        )}


        <button
          onClick={submit}
          className="mt-4 w-full rounded-lg bg-sky-700 py-3 text-sm text-white"
        >
          {mode==="login" ? "Login" :
           mode==="register" ? "Create Account" :
           "Recover Password"}
        </button>


        <div className="mt-4 flex flex-col gap-2 text-xs text-sky-700">

          <button onClick={()=>setMode("login")}>
            Login
          </button>

          <button onClick={()=>setMode("register")}>
            Tengeneza Account
          </button>

          <button onClick={()=>setMode("forgot")}>
            Nimesahau Password
          </button>

          <button onClick={logout}>
            Logout
          </button>

        </div>


        {message && (
          <p className="mt-4 text-xs text-slate-600">
            {message}
          </p>
        )}

      </div>

    </main>
  );
}
