import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      id,
      customer,
      location,
      distanceKm,
      deliveryFee,
      items,
      subtotal,
      total,
      status,
      createdAt,
    } = body;

    const { data, error } = await supabase
      .from("orders")
      .insert({
        id: Date.now(),
        order_number: id,
        customer_name: customer?.name || "",
        customer_phone: customer?.phone || "",
        customer_email: customer?.email || "",
        customer_address: customer?.address || "",
        customer_notes: customer?.notes || "",
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
        distance_km: distanceKm ?? null,
        delivery_fee: deliveryFee ?? 0,
        items: items || [],
        subtotal: subtotal ?? 0,
        total: total ?? 0,
        status: status || "Pending",
        created_at: createdAt || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("FAILED TO SAVE ORDER");
      console.error("CODE:", error?.code);
      console.error("MESSAGE:", error?.message);
      console.error("DETAILS:", error?.details);
      console.error("HINT:", error?.hint);

      return NextResponse.json(
        {
          error: error?.message || "Supabase insert failed",
          code: error?.code || null,
          details: error?.details || null,
          hint: error?.hint || null,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Order API error:", error);

    return NextResponse.json(
      { error: "Failed to process order" },
      { status: 500 }
    );
  }
}
