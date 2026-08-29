"use client";

import { useEffect, useState } from "react";

type Payment = {
  id:number;
  order_number:string;
  amount:number;
  payment_method:string;
  payment_status:string;
  proof?:string|null;
  created_at:string;
};

type Order={
  id:number;
  order_number:string;
  customer_name:string;
  total:number;
};


const money=(n:number)=>
`TZS ${Number(n||0).toLocaleString()}`;


export default function PaymentsModule(){

const [payments,setPayments]=useState<Payment[]>([]);
const [orders,setOrders]=useState<Order[]>([]);
const [orderId,setOrderId]=useState("");
const [amount,setAmount]=useState("");
const [method,setMethod]=useState("Cash");
const [proof,setProof]=useState("");
const [edit,setEdit]=useState<any>(null);
const [loading,setLoading]=useState(true);



async function load(){

try{

setLoading(true);

const res=await fetch("/api/accounting/payments",
{cache:"no-store"});

const data=await res.json();

setPayments(data.payments||[]);
setOrders(data.orders||[]);

}catch(e){

console.error(e);

}

finally{

setLoading(false);

}

}



useEffect(()=>{

load();

},[]);



async function save(){

const body=edit
?{
id:edit.id,
amount,
payment_method:method,
payment_status:"Paid"
}
:{
order_id:Number(orderId),
amount:Number(amount),
payment_method:method,
proof
};


await fetch("/api/accounting/payments",
{
method:edit?"PUT":"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify(body)
});


setEdit(null);
setAmount("");
setProof("");
setOrderId("");

load();

}



async function remove(id:number){

if(!confirm("Delete payment?")) return;


await fetch("/api/accounting/payments",
{
method:"DELETE",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({id})
});


load();

}




function printReceipt(payment:Payment){

const w=window.open("","PRINT");

if(!w)return;


w.document.write(`

<h2>GAMORA ONLINE</h2>

<h3>Payment Receipt</h3>

<p>Order: ${payment.order_number}</p>

<p>Amount: ${money(payment.amount)}</p>

<p>Method: ${payment.payment_method}</p>

<p>Date: ${new Date(payment.created_at).toLocaleString()}</p>

`);

w.print();

}



return(

<section className="space-y-6">


<div className="flex justify-between">

<div>

<p className="text-xs font-black text-[#800020]">
GAMORA ONLINE
</p>

<h2 className="text-2xl font-black">
Payments
</h2>

</div>


<button
onClick={load}
className="rounded-xl bg-[#800020] px-5 py-3 text-white font-bold"
>
🔄 Refresh
</button>


</div>



<div className="rounded-2xl bg-white border p-6">


<h3 className="font-black text-lg">
{edit?"Edit Payment":"Record Payment"}
</h3>


<div className="grid md:grid-cols-4 gap-3 mt-4">


{!edit&&

<select
className="border rounded-xl p-3"
value={orderId}
onChange={e=>setOrderId(e.target.value)}
>

<option>Select Order</option>

{orders.map(o=>(

<option key={o.id} value={o.id}>

{o.order_number}

</option>

))}

</select>

}



<input
className="border rounded-xl p-3"
placeholder="Amount"
value={amount}
onChange={e=>setAmount(e.target.value)}
/>



<select
className="border rounded-xl p-3"
value={method}
onChange={e=>setMethod(e.target.value)}
>

<option>Cash</option>
<option>M-Pesa</option>
<option>Mix by Yas</option>
<option>Airtel Money</option>
<option>NMB Bank</option>
<option>CRDB Bank</option>

</select>



<input
className="border rounded-xl p-3"
type="file"
onChange={e=>
setProof(e.target.files?.[0]?.name||"")
}
/>


</div>


<button
onClick={save}
className="mt-4 rounded-xl bg-[#800020] px-6 py-3 text-white font-bold"
>

{edit?"Update Payment":"Save Payment"}

</button>


</div>




<div className="bg-white border rounded-2xl overflow-hidden">


<table className="w-full">

<thead>

<tr className="border-b bg-slate-50">

<th className="p-4 text-left">Order</th>
<th className="p-4">Amount</th>
<th className="p-4">Method</th>
<th className="p-4">Action</th>

</tr>

</thead>


<tbody>


{payments.map(p=>(

<tr key={p.id} className="border-b">


<td className="p-4 font-bold">
{p.order_number}
</td>


<td className="p-4">
{money(p.amount)}
</td>


<td className="p-4">
{p.payment_method}
</td>


<td className="p-4 flex gap-2">


<button
onClick={()=>{

setEdit(p);
setAmount(String(p.amount));
setMethod(p.payment_method);

}}
className="bg-blue-600 text-white px-3 py-2 rounded-lg"
>
Edit
</button>


<button
onClick={()=>remove(p.id)}
className="bg-red-600 text-white px-3 py-2 rounded-lg"
>
Delete
</button>


<button
onClick={()=>printReceipt(p)}
className="bg-green-600 text-white px-3 py-2 rounded-lg"
>
Receipt
</button>


</td>


</tr>

))}


</tbody>


</table>


</div>



</section>

);


}
