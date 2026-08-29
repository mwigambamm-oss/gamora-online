import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data: orders, error: ordersError } =
      await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

    const { data: payments, error: paymentsError } =
      await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });


    if (ordersError || paymentsError) {
      throw new Error(
        ordersError?.message ||
        paymentsError?.message
      );
    }


    return NextResponse.json({
      success:true,
      orders:orders || [],
      payments:payments || []
    });


  } catch(error:any){

    return NextResponse.json(
      {
        success:false,
        error:error.message
      },
      {status:500}
    );

  }
}



export async function POST(req:Request){

try{

const body = await req.json();


const {data:payment,error}=await supabase
.from("payments")
.insert({

order_id:Number(body.order_id),
amount:Number(body.amount),
payment_method:body.payment_method || "Cash",
payment_status:"Paid",
proof:body.proof || null

})
.select()
.single();


if(error) throw error;



await supabase
.from("orders")
.update({
status:"Paid"
})
.eq("id",Number(body.order_id));



return NextResponse.json({
success:true,
payment
});


}catch(error:any){

return NextResponse.json(
{
success:false,
error:error.message
},
{status:500}
);

}

}




export async function DELETE(req:Request){

try{

const body=await req.json();


const {error}=await supabase
.from("payments")
.delete()
.eq("id",Number(body.id));


if(error) throw error;


return NextResponse.json({
success:true
});


}catch(error:any){

return NextResponse.json(
{
success:false,
error:error.message
},
{status:500}
);

}

}



export async function PUT(req:Request){

try{

const body=await req.json();


const {data,error}=await supabase
.from("payments")
.update({

amount:Number(body.amount),
payment_method:body.payment_method,
payment_status:body.payment_status

})
.eq("id",Number(body.id))
.select()
.single();



if(error) throw error;


return NextResponse.json({
success:true,
payment:data
});


}catch(error:any){

return NextResponse.json(
{
success:false,
error:error.message
},
{status:500}
);

}

}
