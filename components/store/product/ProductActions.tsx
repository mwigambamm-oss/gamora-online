"use client";

import {useState} from "react";


export default function ProductActions({
stock=0,
price=0
}:{
stock:number;
price:number;
}){


const [qty,setQty]=useState(1);


return (

<div className="space-y-5">


<div className="flex items-center gap-4">

<button
onClick={()=>setQty(Math.max(1,qty-1))}
className="rounded-lg border px-4 py-2"
>
-
</button>


<span className="font-black">
{qty}
</span>


<button
onClick={()=>setQty(Math.min(stock,qty+1))}
className="rounded-lg border px-4 py-2"
>
+
</button>


</div>



<div className="grid gap-3 md:grid-cols-2">

<button
className="rounded-xl border border-[#800020] px-6 py-4 font-black text-[#800020]"
>
Add To Cart
</button>


<button
className="rounded-xl bg-[#800020] px-6 py-4 font-black text-white"
>
Buy Now
</button>

</div>


</div>

);

}
