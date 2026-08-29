import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";


export async function POST(req:Request){

try{

const body = await req.json();

const {
product_id,
image_id,
sort_order,
is_primary
}=body;


if(is_primary){

await supabase
.from("product_images")
.update({
is_primary:false
})
.eq(
"product_id",
product_id
);

}


const {error}=await supabase
.from("product_images")
.update({
sort_order,
is_primary
})
.eq("id",image_id);


if(error) throw error;


return NextResponse.json({
success:true
});


}catch(error:any){

return NextResponse.json({
success:false,
error:error.message
},{
status:500
});

}

}
