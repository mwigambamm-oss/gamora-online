"use client";

export default function TopProducts({
 products=[],
 orderItems=[]
}:{
 products:any[];
 orderItems:any[];
}){

 const map:any={};

 orderItems.forEach((item:any)=>{

   map[item.product_name] =
   (map[item.product_name] || 0)
   +
   Number(item.quantity || 0);

 });


 const top =
 Object.entries(map)
 .sort((a:any,b:any)=>b[1]-a[1])
 .slice(0,5);


 return (

 <div className="rounded-2xl border bg-white p-6 shadow-sm">

  <h3 className="text-lg font-black">
    Top Selling Products
  </h3>


  <div className="mt-5 space-y-3">

  {top.length===0 ? (

    <p className="text-sm text-slate-500">
      No sales yet.
    </p>

  ):(

   top.map(([name,count]:any)=>(
    <div
     key={name}
     className="flex justify-between rounded-xl bg-slate-50 p-3"
    >
      <span className="font-bold">
        {name}
      </span>

      <span className="font-black text-[#800020]">
        {count} sold
      </span>

    </div>
   ))

  )}

  </div>

 </div>

 );

}
