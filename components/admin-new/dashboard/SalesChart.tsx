"use client";

type Order = {
  created_at:string;
  total:number;
};

export default function SalesChart({
  orders
}:{
  orders:Order[];
}){

  const data = orders.reduce((acc:any,order)=>{

    const date = new Date(order.created_at)
      .toLocaleDateString();

    acc[date] =
      (acc[date] || 0) +
      Number(order.total || 0);

    return acc;

  },{});


  const rows = Object.entries(data);

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">

      <h3 className="text-lg font-black">
        Sales Overview
      </h3>

      <div className="mt-5 space-y-3">

        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">
            No sales data yet.
          </p>
        ) : (

          rows.map(([day,value]:any)=>(
            <div
              key={day}
              className="flex items-center gap-3"
            >

              <span className="w-32 text-xs text-slate-500">
                {day}
              </span>

              <div className="flex-1 rounded-full bg-slate-100">

                <div
                  className="rounded-full bg-[#800020] px-3 py-1 text-xs text-white"
                  style={{
                    width:
                    `${Math.min(
                      Number(value)/100,
                      100
                    )}%`
                  }}
                >
                  TZS {Number(value).toLocaleString()}
                </div>

              </div>

            </div>
          ))

        )}

      </div>

    </div>
  );
}
