import { NextResponse } from "next/server";
import { saveProduct } from "@/lib/products";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const product = await saveProduct({
      name: body.name || "",
      name_sw: body.name_sw || "",
      price: Number(body.price || 0),
      oldPrice: Number(body.oldPrice || body.price || 0),
      category: body.category || "",
      category_sw: body.category_sw || "",
      stock: Number(body.stock || 0),
      description: body.description || "",
      description_sw: body.description_sw || "",
      image: body.image || "",
      images: body.images || [],
      cost_price: Number(body.cost_price || 0),
      colors: body.colors || [],
      sizes: body.sizes || [],
      discount: Number(body.discount || 0),
    });

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error: any) {
    console.error("PRODUCT CREATE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create product",
      },
      { status: 500 }
    );
  }
}
