import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const orderNumber = String(
      body.order_number || ""
    ).trim();

    const status = String(
      body.status || ""
    ).trim();

    if (!orderNumber || !status) {
      return NextResponse.json(
        {
          error: "Missing order number or status",
        },
        {
          status: 400,
        }
      );
    }

    const { data, error } = await supabase
      .from("orders")
      .update({
        status,
      })
      .eq("order_number", orderNumber)
      .select()
      .single();

    if (error) {
      console.error(
        "Status update error:",
        error
      );

      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      order: data,
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}
