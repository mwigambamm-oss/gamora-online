import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("product_costs")
      .select("product_id,cost_price,supplier,created_at");

    if (error) throw error;

    return NextResponse.json({
      success: true,
      costs: data || [],
    });
  } catch (error) {
    console.error("Product costs GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load product costs",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const productId = Number(body.product_id);
    const costPrice = Number(body.cost_price || 0);
    const supplier =
      typeof body.supplier === "string"
        ? body.supplier.trim()
        : "";

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(costPrice) || costPrice < 0) {
      return NextResponse.json(
        { error: "Invalid cost price." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("product_costs")
      .upsert(
        {
          product_id: productId,
          cost_price: costPrice,
          supplier,
        },
        {
          onConflict: "product_id",
        }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      cost: data,
    });
  } catch (error) {
    console.error("Product costs POST error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to save product cost",
      },
      { status: 500 }
    );
  }
}
