"use client";

import { useState } from "react";

export default function ProductGallery({
 images=[]
}:{
 images:string[];
}){

const [active,setActive]=useState(images[0] || "");

return (

<div className="space-y-4">

<div className="flex h-[500px] items-center justify-center rounded-2xl bg-white">

<img
src={active}
className="h-full w-full object-contain"
/>

</div>


<div className="flex gap-3 overflow-x-auto">

{images.map((img,i)=>(

<button
key={i}
onClick={()=>setActive(img)}
className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border"
>

<img
src={img}
className="h-full w-full object-cover"
/>

</button>

))}

</div>

</div>

);

}
