import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

async function syncOrderPaymentStatus(orderNumber: string) {
  const [{ data: order, error: orderError }, { data: payments, error: paymentsError }] =
    await Promise.all([
      supabase
        .from("orders")
        .select("id, order_number, total, status")
        .eq("order_number", orderNumber)
        .single(),

      supabase
        .from("payments")
        .select("amount, payment_status")
        .eq("order_number", orderNumber)
        .eq("payment_status", "Paid"),
    ]);

  if (orderError) throw orderError;
  if (paymentsError) throw paymentsError;
  if (!order) throw new Error("Order not found");

  const paidAmount = (payments || []).reduce(
    (sum: number, payment: any) => sum + Number(payment.amount || 0),
    0
  );

  const orderTotal = Number(order.total || 0);

  let newStatus = order.status;

  if (paidAmount >= orderTotal && orderTotal > 0) {
    newStatus = "Paid";
  } else if (paidAmount > 0) {
    newStatus = "Pending";
  }

  if (newStatus !== order.status) {
    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", order.id);

    if (updateError) throw updateError;
  }

  return {
    orderTotal,
    paidAmount,
    unpaidAmount: Math.max(orderTotal - paidAmount, 0),
    status: newStatus,
  };
}

export async function GET() {
  try {
    const [{ data: orders, error: ordersError }, { data: payments, error: paymentsError }] =
      await Promise.all([
        supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false }),

        supabase
          .from("payments")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

    if (ordersError || paymentsError) {
      throw new Error(
        ordersError?.message || paymentsError?.message || "Failed to load payments"
      );
    }

    return NextResponse.json({
      success: true,
      orders: orders || [],
      payments: payments || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const orderId = Number(body.order_id);
    const amount = Number(body.amount);

    if (!orderId || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid order and payment amount are required.",
        },
        { status: 400 }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, total")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error(orderError?.message || "Order not found");
    }

    if (!order.order_number) {
      throw new Error("This order does not have an order number.");
    }

    const paymentStatus = body.payment_status || "Paid";

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        order_number: order.order_number,
        amount,
        payment_method: body.payment_method || "Cash",
        payment_status: paymentStatus,
        transaction_ref: body.transaction_ref
          ? String(body.transaction_ref).trim()
          : null,
      })
      .select()
      .single();

    if (paymentError) {
      throw paymentError;
    }

    const paymentSummary = await syncOrderPaymentStatus(
      String(order.order_number)
    );

    return NextResponse.json({
      success: true,
      payment,
      paymentSummary,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const paymentId = Number(body.id);

    const { data: payment, error: paymentFetchError } = await supabase
      .from("payments")
      .select("id, order_number")
      .eq("id", paymentId)
      .single();

    if (paymentFetchError || !payment) {
      throw new Error(paymentFetchError?.message || "Payment not found");
    }

    const { error } = await supabase
      .from("payments")
      .delete()
      .eq("id", paymentId);

    if (error) {
      throw error;
    }

    const paymentSummary = await syncOrderPaymentStatus(
      String(payment.order_number)
    );

    return NextResponse.json({
      success: true,
      paymentSummary,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const paymentId = Number(body.id);

    const { data: existingPayment, error: fetchError } = await supabase
      .from("payments")
      .select("id, order_number")
      .eq("id", paymentId)
      .single();

    if (fetchError || !existingPayment) {
      throw new Error(fetchError?.message || "Payment not found");
    }

    const { data, error } = await supabase
      .from("payments")
      .update({
        amount: Number(body.amount),
        payment_method: body.payment_method,
        payment_status: body.payment_status,
        transaction_ref: body.transaction_ref
          ? String(body.transaction_ref).trim()
          : null,
      })
      .eq("id", paymentId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const paymentSummary = await syncOrderPaymentStatus(
      String(existingPayment.order_number)
    );

    return NextResponse.json({
      success: true,
      payment: data,
      paymentSummary,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
