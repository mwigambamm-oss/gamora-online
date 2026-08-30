"use client";

import { useEffect, useState } from "react";

type Message = {
  id:number;
  name:string;
  email:string | null;
  message:string;
  created_at:string;
  status:string;
};

export default function MessagesPage(){

const [messages,setMessages]=useState<Message[]>([]);
const [selected,setSelected]=useState<Message | null>(null);

async function loadMessages(){
  const res = await fetch("/api/admin/messages");
  const data = await res.json();
  setMessages(Array.isArray(data) ? data : []);
}

useEffect(()=>{
  loadMessages();
},[]);

return (
<main className="min-h-screen bg-slate-50 p-4 md:ml-64">

<h1 className="mb-5 text-xl font-medium text-slate-800">
💬 Messages
</h1>

<div className="grid gap-4 lg:grid-cols-[320px_1fr]">

{/* INBOX */}

<div className="rounded-xl border bg-white">

<div className="border-b px-4 py-3 text-sm font-medium">
Inbox
</div>

<div className="divide-y">

{messages.map((item)=>(

<button
key={item.id}
onClick={()=>setSelected(item)}
className={`w-full p-3 text-left transition hover:bg-slate-50 ${
selected?.id === item.id
? "bg-sky-50"
: "bg-white"
}`}
>

<div className="flex justify-between">

<span className="text-sm font-medium text-slate-800">
{item.name}
</span>

<span className="text-[10px] text-slate-400">
{new Date(item.created_at)
.toLocaleDateString()}
</span>

</div>

<p className="mt-1 truncate text-xs text-slate-500">
{item.message}
</p>

</button>

))}

</div>

</div>


{/* CHAT */}

<div className="rounded-xl border bg-white">

{selected ? (

<div>

<div className="border-b px-5 py-4">

<h2 className="text-sm font-medium">
{selected.name}
</h2>

<p className="text-xs text-slate-400">
{selected.email}
</p>

</div>


<div className="p-5">

<div className="max-w-xl rounded-xl bg-slate-100 p-4 text-sm text-slate-700">
{selected.message}
</div>

<p className="mt-4 text-xs text-slate-400">
{new Date(selected.created_at)
.toLocaleString()}
</p>

</div>

</div>

) : (

<div className="flex h-64 items-center justify-center text-sm text-slate-400">
Select a message to open chat
</div>

)}

</div>

</div>

</main>
)

}
