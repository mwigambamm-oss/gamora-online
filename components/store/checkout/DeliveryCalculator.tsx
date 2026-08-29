"use client";

import {useState} from "react";


export default function DeliveryCalculator(){

const [km,setKm]=useState(0);

const fee =
Number(km || 0) * 671;


return (

<div className="rounded-2xl border bg-white p-5">

<h3 className="font-black">
Delivery Calculation
</h3>


<input
type="number"
placeholder="Distance KM"
onChange={(e)=>setKm(Number(e.target.value))}
className="mt-4 w-full rounded-xl border px-4 py-3"
/>


<p className="mt-4 font-bold">
Delivery Fee:
TZS {fee.toLocaleString()}
</p>


</div>

);

}
