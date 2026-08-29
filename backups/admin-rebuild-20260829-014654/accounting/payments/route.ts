import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const [ordersResult, paymentsResult] = await Promise.all([
      supabase
        .from("orders")
        .select(
          "id,order_number,customer_name,customer_phone,total,status,created_at"
        )
        .neq("status", "Cancelled")
        .order("created_at", { ascending: false }),

      supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (ordersResult.error) throw ordersResult.error;
    if (paymentsResult.error) throw paymentsResult.error;

    return NextResponse.json({
      success: true,
      orders: ordersResult.data || [],
      payments: paymentsResult.data || [],
    });
  } catch (error: any) {
    console.error("Payments GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const orderId = Number(body.order_id);
    const amount = Number(body.amount);
    const paymentMethod = String(
      body.payment_method || "Cash"
    );

    if (!orderId || !amount || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Order and valid payment amount are required.",
        },
        { status: 400 }
      );
    }

    const { data: order, error: orderError } =
      await supabase
        .from("orders")
        .select("id,total,status,order_number")
        .eq("id", orderId)
        .single();

    if (orderError) throw orderError;

    if (order.status === "Cancelled") {
      return NextResponse.json(
        {
          success: false,
          error: "Cancelled orders cannot receive payments.",
        },
        { status: 400 }
      );
    }

    const { data: previousPayments, error: previousError } =
      await supabase
        .from("payments")
        .select("amount")
        .eq("order_number", order.order_number)
        .eq("payment_status", "Paid");

    if (previousError) throw previousError;

    const alreadyPaid =
      (previousPayments || []).reduce(
        (sum, payment) =>
          sum + Number(payment.amount || 0),
        0
      );

    const balance =
      Number(order.total || 0) - alreadyPaid;

    if (amount > balance) {
      return NextResponse.json(
        {
          success: false,
          error: `Payment exceeds outstanding balance of TZS ${balance.toLocaleString()}.`,
        },
        { status: 400 }
      );
    }

    const { data: payment, error: paymentError } =
      await supabase
        .from("payments")
        .insert({
          order_number: order.order_number,
          amount,
          payment_method: paymentMethod,
          payment_status: "Paid",
        })
        .select()
        .single();

    if (paymentError) throw paymentError;

    const newBalance = balance - amount;

    if (newBalance <= 0) {
      await supabase
        .from("orders")
        .update({ status: "Confirmed" })
        .eq("id", orderId);
    }

    return NextResponse.json({
      success: true,
      payment,
      balance: newBalance,
    });
  } catch (error: any) {
    console.error("Payments POST error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
