import { NextResponse } from "next/server";
import { saveProduct } from "@/lib/products";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const product = await saveProduct({
      name: body.name || "",
      price: Number(body.price || 0),
      oldPrice: Number(body.oldPrice || body.price || 0),
      category: body.category || "",
      stock: Number(body.stock || 0),
      description: body.description || "",
      image: body.image || "",
      images: body.images || [],
      cost_price: Number(body.cost_price || 0),
      colors: body.colors || [],
      sizes: body.sizes || [],
      discount: Number(body.discount || 0),
    });

    return NextResponse.json({
      success:true,
      product
    });

  } catch(error:any){

    return NextResponse.json(
      {
        success:false,
        error:error.message
      },
      {
        status:500
      }
    );
  }
}
