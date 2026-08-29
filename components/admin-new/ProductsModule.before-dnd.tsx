"use client";

import { useState } from "react";

export default function ProductsModule(){

const [images,setImages]=useState<File[]>([]);
const [preview,setPreview]=useState<string[]>([]);

const [cost,setCost]=useState(0);
const [price,setPrice]=useState(0);


function selectImages(files:FileList|null){

if(!files)return;

const selected=[
...images,
...Array.from(files)
].slice(0,20);


setImages(selected);

setPreview(
selected.map(file=>URL.createObjectURL(file))
);

}


function removeImage(index:number){

const updated=images.filter((_,i)=>i!==index);

setImages(updated);

setPreview(
updated.map(file=>URL.createObjectURL(file))
);

}



return(

<section className="space-y-6">


<div>
<h2 className="text-2xl font-black">
Add Product
</h2>

<p className="text-sm text-slate-500">
Create new product for Gamora Online
</p>

</div>



<div className="rounded-2xl border bg-white p-6 shadow-sm">

<h3 className="font-black mb-5">
Product Information
</h3>


<div className="grid gap-4 md:grid-cols-2">


<input
className="rounded-xl border p-3"
placeholder="Product Name"
/>


<input
className="rounded-xl border p-3"
placeholder="Brand"
/>


<input
className="rounded-xl border p-3"
placeholder="SKU"
/>


<input
className="rounded-xl border p-3"
placeholder="Category"
/>


<textarea
className="rounded-xl border p-3 md:col-span-2"
placeholder="Short Description"
/>


</div>

</div>




<div className="rounded-2xl border bg-white p-6 shadow-sm">

<h3 className="font-black mb-4">
Product Images
</h3>


<div className="rounded-xl border-2 border-dashed p-8 text-center">

<p className="font-bold">
📷 Upload Product Images
</p>

<p className="text-sm text-slate-500">
Maximum 20 images
</p>


<input
type="file"
multiple
accept="image/png,image/jpeg,image/webp"
className="mt-4"
onChange={(e)=>selectImages(e.target.files)}
/>


</div>


<div className="mt-5 text-sm font-bold">
{images.length} / 20 images
</div>



<div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-5">


{preview.map((img,index)=>(

<div
key={index}
className="relative rounded-xl overflow-hidden border"
>

<img
src={img}
className="h-32 w-full object-cover"
/>


{index===0 &&

<span className="absolute left-2 top-2 rounded bg-[#800020] px-2 py-1 text-xs text-white">
⭐ Main Image
</span>

}


<button
onClick={()=>removeImage(index)}
className="absolute right-2 top-2 rounded-full bg-red-600 px-2 text-white"
>
✕
</button>


</div>

))}


</div>


</div>





<div className="rounded-2xl border bg-white p-6 shadow-sm">

<h3 className="font-black mb-4">
Pricing
</h3>


<div className="grid gap-4 md:grid-cols-3">


<input
type="number"
placeholder="Cost Price"
className="rounded-xl border p-3"
onChange={(e)=>setCost(Number(e.target.value))}
/>


<input
type="number"
placeholder="Selling Price"
className="rounded-xl border p-3"
onChange={(e)=>setPrice(Number(e.target.value))}
/>


<div className="rounded-xl bg-slate-50 p-3">

Profit:
<strong>
{" "}
{price-cost}
</strong>

</div>


</div>

</div>





<div className="rounded-2xl border bg-white p-6 shadow-sm">

<h3 className="font-black mb-4">
Inventory
</h3>


<input
className="rounded-xl border p-3"
placeholder="Initial Stock"
/>


</div>




<div className="flex gap-3">

<button className="rounded-xl border px-6 py-3 font-bold">
Save Draft
</button>


<button className="rounded-xl bg-[#800020] px-6 py-3 font-bold text-white">
Publish Product
</button>


</div>



</section>

);

}
