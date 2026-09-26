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

    // Automatically record delivery cost when an order is delivered.
    // The customer-paid delivery_fee remains Delivery Income.
    // This creates the matching Transport / Delivery expense automatically.
    if (status.toLowerCase() === "delivered") {
      try {
        const deliveryFee = Number(data?.delivery_fee || 0);

        if (deliveryFee > 0) {
          const { data: existingExpense, error: expenseCheckError } =
            await supabase
              .from("expenses")
              .select("id")
              .eq("category", "Transport / Delivery")
              .eq("notes", `Order: ${orderNumber}`)
              .limit(1)
              .maybeSingle();

          if (expenseCheckError) {
            console.error(
              "Delivery expense check failed:",
              expenseCheckError
            );
          } else if (!existingExpense) {
            const { error: expenseError } = await supabase
              .from("expenses")
              .insert({
                title: `Delivery - ${orderNumber}`,
                amount: deliveryFee,
                category: "Transport / Delivery",
                expense_date: new Date().toISOString().slice(0, 10),
                notes: `Order: ${orderNumber}`,
              });

            if (expenseError) {
              console.error(
                "Automatic delivery expense creation failed:",
                expenseError
              );
            } else {
              console.log(
                `Automatic delivery expense created: ${orderNumber} - TZS ${deliveryFee}`
              );
            }
          } else {
            console.log(
              `Delivery expense already exists for ${orderNumber}; skipping duplicate.`
            );
          }
        }
      } catch (deliveryExpenseError) {
        console.error(
          "Automatic delivery expense processing failed:",
          deliveryExpenseError
        );
      }
    }

    try {
      const {
        syncTelegramOrderStatus,
      } = await import("@/lib/robot");

      await syncTelegramOrderStatus(
        orderNumber,
        status
      );
    } catch (telegramError) {
      console.error(
        "Telegram status sync failed:",
        telegramError
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
