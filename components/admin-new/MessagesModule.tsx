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

export default function MessagesModule(){

const [messages,setMessages]=useState<Message[]>([]);
const [reply,setReply]=useState("");
const [activeReply,setActiveReply]=useState<number | null>(null);

useEffect(()=>{

fetch("/api/admin/messages")
.then(res=>res.json())
.then(data=>{
if(Array.isArray(data)){
setMessages(data);
}
});

},[]);


async function sendReply(email:string){

if(!reply.trim()) return;


const res = await fetch("/api/admin/messages/reply",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
email,
reply
})
});


const data = await res.json();


if(data.success){

alert("Reply sent successfully");

setReply("");
setActiveReply(null);

}else{

alert("Failed to send reply");

}

}


return (
<div>

<h2 className="mb-6 text-2xl font-black">
💬 Customer Messages
</h2>


<div className="grid gap-4">

{messages.map((item)=>(

<div
key={item.id}
className="rounded-2xl border border-[#CBD5E1] bg-[#E2E8F0] p-6 shadow"
>


<div className="flex justify-between">

<h3 className="text-lg font-black">
{item.name}
</h3>


<span className="rounded-full bg-[#FFF7ED] px-3 py-1 text-xs text-[#D97706]">
{item.status}
</span>

</div>


<p className="mt-2 font-semibold text-[#172554]">
📧 {item.email || "No email"}
</p>


<p className="mt-4 text-[#172033]">
{item.message}
</p>


<p className="mt-2 text-xs text-[#94A3B8]">
{new Date(item.created_at).toLocaleString()}
</p>


<button
onClick={()=>setActiveReply(
activeReply === item.id ? null : item.id
)}
className="mt-4 rounded-lg bg-[#F59E0B] px-4 py-2 text-white font-bold hover:bg-[#D97706]"
>
✉️ Reply
</button>


{activeReply === item.id && (

<div className="mt-4">

<textarea
value={reply}
onChange={(e)=>setReply(e.target.value)}
placeholder="Andika reply hapa..."
className="h-28 w-full rounded-lg border p-3"
/>


<button
onClick={()=>sendReply(item.email || "")}
className="mt-3 rounded-lg bg-[#0F766E] px-5 py-2 font-bold text-white hover:bg-[#115E59]"
>
Send Reply
</button>

</div>

)}


</div>

))}

</div>

</div>
)

}
