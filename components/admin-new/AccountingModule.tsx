"use client";

import { useEffect, useState } from "react";

type Summary = {
  orders: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  pendingOrders: number;
  pendingPayments: number;
  lowStock: number;
  outOfStock: number;
};

const money = (n:number) =>
  `TZS ${Number(n || 0).toLocaleString()}`;

export default function AccountingModule(){

  const [summary,setSummary] = useState<Summary|null>(null);
  const [loading,setLoading] = useState(true);
  const [period,setPeriod] = useState("This Month");

  async function load(){

    try{

      setLoading(true);

      const res = await fetch(
        `/api/admin/dashboard?period=${encodeURIComponent(period)}`,
        {
          cache:"no-store"
        }
      );

      const data = await res.json();

      if(data.success){
        setSummary(data.summary);
      }

    }catch(error){

      console.error(error);

    }finally{

      setLoading(false);

    }

  }


  useEffect(()=>{
    load();
  },[period]);


  return (

<section className="space-y-6">

<div className="flex flex-wrap justify-between gap-4">

<div>

<p className="text-xs font-black uppercase tracking-widest text-[#800020]">
GAMORA ONLINE
</p>

<h2 className="text-3xl font-black text-[#3F3437]">
Accounting
</h2>

<p className="text-sm text-slate-500">
Financial control center
</p>

</div>


<select
value={period}
onChange={(e)=>setPeriod(e.target.value)}
className="rounded-xl border px-4 py-3"
>

<option>Today</option>
<option>Yesterday</option>
<option>This Week</option>
<option>This Month</option>
<option>Last Month</option>
<option>This Year</option>

</select>

</div>



{loading ? (

<div className="rounded-2xl bg-white p-10 text-center">
Loading accounting...
</div>

) : summary && (

<>


<div className="grid gap-4 md:grid-cols-3">


<div className="rounded-2xl bg-white border p-5">
Revenue
<h3 className="text-2xl font-black">
{money(summary.revenue)}
</h3>
</div>


<div className="rounded-2xl bg-white border p-5">
Gross Profit
<h3 className="text-2xl font-black text-green-700">
{money(summary.grossProfit)}
</h3>
</div>


<div className="rounded-2xl bg-white border p-5">
Net Profit
<h3 className="text-2xl font-black text-[#800020]">
{money(summary.netProfit)}
</h3>
</div>


</div>



<div className="grid gap-6 lg:grid-cols-2">


<div className="rounded-2xl bg-white border p-6">


<h3 className="text-xl font-black">
Income Statement
</h3>


<div className="mt-5 space-y-4">


<div className="flex justify-between">
<span>Revenue</span>
<b>{money(summary.revenue)}</b>
</div>


<div className="flex justify-between">
<span>COGS</span>
<b>{money(summary.cogs)}</b>
</div>


<div className="border-t pt-3 flex justify-between">
<span className="font-bold">
Gross Profit
</span>

<b>
{money(summary.grossProfit)}
</b>

</div>



<div className="flex justify-between">
<span>Expenses</span>
<b className="text-red-600">
{money(summary.expenses)}
</b>
</div>



<div className="border-t pt-3 flex justify-between text-lg">
<span className="font-black">
NET PROFIT
</span>

<b>
{money(summary.netProfit)}
</b>

</div>


</div>


</div>



<div className="rounded-2xl bg-white border p-6">

<h3 className="text-xl font-black">
Reports Export
</h3>


<div className="mt-5 flex gap-3">


<button className="rounded-xl bg-[#800020] px-5 py-3 text-white font-bold">
Export PDF
</button>


<button className="rounded-xl bg-slate-800 px-5 py-3 text-white font-bold">
Export Excel
</button>


</div>


<p className="mt-5 text-sm text-slate-500">
Export engine itaunganishwa hatua inayofuata.
</p>


</div>


</div>


</>

)}

</section>

)

}
