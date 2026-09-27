"use client";

export default function NotificationBell({
 pendingOrders=0,
 pendingPayments=0,
 lowStock=0,
 onClick
}:{
 pendingOrders:number;
 pendingPayments:number;
 lowStock:number;
 onClick: () => void;
}){

 const total =
 pendingOrders +
 pendingPayments +
 lowStock;


 return (

 <div className="relative">

   <button
    type="button"
    onClick={onClick}
    aria-label="Open notifications"
    className="relative rounded-xl border border-[#CBD5E1] bg-[#E2E8F0] px-4 py-3 shadow-sm hover:bg-[#CBD5E1]"
   >

    🔔

    {total > 0 && (
      <span className="absolute -right-1 -top-1 rounded-full bg-[#172554] px-2 py-0.5 text-xs font-black text-white">
        {total}
      </span>
    )}

   </button>


 </div>

 );

}
