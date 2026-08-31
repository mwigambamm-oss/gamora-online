import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req:Request){

  try{

    const body = await req.json();

    const {id, storage_key} = body;


    if(!id){
      return NextResponse.json({
        success:false,
        error:"Image id required"
      },{
        status:400
      });
    }


    if(storage_key){

      await supabase.storage
      .from("products")
      .remove([storage_key]);

    }


    const {error} = await supabase
    .from("product_images")
    .delete()
    .eq("id",id);


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
