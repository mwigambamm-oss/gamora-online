"use client";

import { useEffect, useState } from "react";

type Order={
id:number;
order_number:string;
customer_name:string;
total:number;
status:string;
created_at:string;
};


const money=(n:number)=>
`TZS ${Number(n||0).toLocaleString()}`;


export default function RecentOrders(){

const [orders,setOrders]=useState<Order[]>([]);


async function load(){

try{

const res=await fetch("/api/orders",
{cache:"no-store"});

const data=await res.json();

setOrders(
(data.orders||[]).slice(0,5)
);

}catch(e){

console.error(e);

}

}


useEffect(()=>{

load();

},[]);



return(

<div className="rounded-2xl border bg-white p-6 shadow-sm">

<h3 className="text-lg font-black">
Recent Orders
</h3>


<div className="mt-4 space-y-3">

{orders.length===0 &&

<p className="text-sm text-slate-500">
No orders found.
</p>

}


{orders.map(order=>(

<div
key={order.id}
className="flex items-center justify-between rounded-xl bg-slate-50 p-4"
>


<div>

<p className="font-bold">
{order.order_number}
</p>

<p className="text-sm text-slate-500">
{order.customer_name}
</p>

</div>


<div className="text-right">

<p className="font-black">
{money(order.total)}
</p>

<span className="text-xs rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
{order.status}
</span>

</div>


</div>

))}


</div>

</div>

);

}
