"use client";

import { useState } from "react";

export default function ProfilePage() {

const [logged,setLogged] = useState(false);

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
Ingia au tengeneza akaunti yako ya GAMORA ONLINE.
</p>


<div className="mt-6 rounded-xl border bg-white p-5">


{logged ? (

<div>

<h2 className="text-sm font-medium">
Karibu kwenye akaunti yako
</h2>

<div className="mt-4 space-y-2 text-xs text-slate-600">

<p>📦 Oda Zangu</p>
<p>♡ Orodha ya Matamanio</p>
<p>👤 Taarifa Zangu</p>

</div>


<button
onClick={()=>setLogged(false)}
className="mt-5 rounded-lg bg-red-600 px-4 py-2 text-xs text-white"
>
Logout
</button>

</div>

) : (

<div className="space-y-3">


<button
onClick={()=>setLogged(true)}
className="w-full rounded-lg bg-sky-700 py-3 text-sm text-white"
>
Login
</button>


<button
className="w-full rounded-lg border py-3 text-sm text-slate-700"
>
Register
</button>


<a
href="/recover-password"
className="block text-center text-xs text-sky-700"
>
Recover Password
</a>


</div>

)}

</div>


</section>

</main>
)

}
