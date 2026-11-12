
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getAdminDatabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Supabase server environment variables are missing.");
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function isAuthorizedAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) return false;

  const cookieStore = await cookies();

  const authClient = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {}
      },
    },
  });

  const { data, error } = await authClient.auth.getUser();

  if (error || !data.user) return false;

  return (
    data.user.email?.toLowerCase() ===
    "officialgamoraonline@gmail.com"
  );
}

async function syncOrderPaymentStatus(
  db: ReturnType<typeof getAdminDatabase>,
  orderNumber: string
) {
  const [
    { data: order, error: orderError },
    { data: payments, error: paymentsError },
  ] = await Promise.all([
    db
      .from("orders")
      .select("id, order_number, total, status")
      .eq("order_number", orderNumber)
      .single(),

    db
      .from("payments")
      .select("amount, payment_status")
      .eq("order_number", orderNumber)
      .eq("payment_status", "Paid"),
  ]);

  if (orderError) throw orderError;
  if (paymentsError) throw paymentsError;
  if (!order) throw new Error("Order not found");

  const paidAmount = (payments || []).reduce(
    (sum: number, payment: any) =>
      sum + Number(payment.amount || 0),
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
    const { error: updateError } = await db
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
    if (!(await isAuthorizedAdmin())) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access is required." },
        { status: 403 }
      );
    }

    const db = getAdminDatabase();

    const [
      { data: orders, error: ordersError },
      { data: payments, error: paymentsError },
    ] = await Promise.all([
      db
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false }),

      db
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (ordersError) throw ordersError;
    if (paymentsError) throw paymentsError;

    return NextResponse.json({
      success: true,
      orders: orders || [],
      payments: payments || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    if (!(await isAuthorizedAdmin())) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access is required." },
        { status: 403 }
      );
    }

    const db = getAdminDatabase();
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

    const { data: order, error: orderError } = await db
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

    const { data: payment, error: paymentError } = await db
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

    if (paymentError) throw paymentError;

    const paymentSummary = await syncOrderPaymentStatus(
      db,
      String(order.order_number)
    );

    return NextResponse.json({
      success: true,
      payment,
      paymentSummary,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    if (!(await isAuthorizedAdmin())) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access is required." },
        { status: 403 }
      );
    }

    const db = getAdminDatabase();
    const body = await req.json();
    const paymentId = Number(body.id);

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: "Valid payment ID is required." },
        { status: 400 }
      );
    }

    const { data: payment, error: paymentFetchError } = await db
      .from("payments")
      .select("id, order_number")
      .eq("id", paymentId)
      .single();

    if (paymentFetchError || !payment) {
      throw new Error(paymentFetchError?.message || "Payment not found");
    }

    const { error } = await db
      .from("payments")
      .delete()
      .eq("id", paymentId);

    if (error) throw error;

    const paymentSummary = await syncOrderPaymentStatus(
      db,
      String(payment.order_number)
    );

    return NextResponse.json({
      success: true,
      paymentSummary,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    if (!(await isAuthorizedAdmin())) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access is required." },
        { status: 403 }
      );
    }

    const db = getAdminDatabase();
    const body = await req.json();
    const paymentId = Number(body.id);
    const amount = Number(body.amount);

    if (
      !paymentId ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid payment ID and amount are required.",
        },
        { status: 400 }
      );
    }

    const { data: existingPayment, error: fetchError } = await db
      .from("payments")
      .select("id, order_number")
      .eq("id", paymentId)
      .single();

    if (fetchError || !existingPayment) {
      throw new Error(fetchError?.message || "Payment not found");
    }

    const { data, error } = await db
      .from("payments")
      .update({
        amount,
        payment_method: body.payment_method,
        payment_status: body.payment_status,
        transaction_ref: body.transaction_ref
          ? String(body.transaction_ref).trim()
          : null,
      })
      .eq("id", paymentId)
      .select()
      .single();

    if (error) throw error;

    const paymentSummary = await syncOrderPaymentStatus(
      db,
      String(existingPayment.order_number)
    );

    return NextResponse.json({
      success: true,
      payment: data,
      paymentSummary,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
