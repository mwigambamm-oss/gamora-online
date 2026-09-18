"use client";

import {useState} from "react";
import {supabase} from "@/lib/supabase";
import {useRouter} from "next/navigation";

export default function Register(){

const router=useRouter();

const [email,setEmail]=useState("");
const [password,setPassword]=useState("");

async function signup(){

const {error}=await supabase.auth.signUp({
email,
password
});

if(error){
alert(error.message);
return;
}

alert("Account created");
router.push("/login");

}

return(
<main className="min-h-screen bg-slate-50 p-5">

<div className="mx-auto max-w-md rounded-xl border bg-white p-6">

<h1 className="text-lg font-medium">
Create Account
</h1>

<input
className="mt-5 w-full rounded-lg border px-3 py-2 text-sm"
placeholder="Email"
onChange={e=>setEmail(e.target.value)}
/>

<input
type="password"
className="mt-3 w-full rounded-lg border px-3 py-2 text-sm"
placeholder="Password"
onChange={e=>setPassword(e.target.value)}
/>

<button
onClick={signup}
className="mt-4 w-full rounded-lg bg-sky-700 py-2 text-sm text-white"
>
Register
</button>

</div>

</main>
)

}
