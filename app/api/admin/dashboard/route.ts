import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "Today";
const customFrom = searchParams.get("from");
const customTo = searchParams.get("to");

  const now = new Date();

  let fromDate: Date | null = null;
  let toDate: Date | null = null;

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  if (period === "Today") {
    fromDate = startOfToday;
    toDate = now;
  }

  if (period === "Yesterday") {
    fromDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1
    );

    toDate = startOfToday;
  }

  if (period === "This Week") {
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;

    fromDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - diff
    );

    toDate = now;
  }

  if (period === "This Month") {
    fromDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    toDate = now;
  }

  if (period === "Last Month") {
    fromDate = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );

    toDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );
  }

  if (period === "This Year") {
    fromDate = new Date(
      now.getFullYear(),
      0,
      1
    );

    toDate = now;
  }

if (period === "Custom Range" && customFrom && customTo) {
  fromDate = new Date(customFrom);
  toDate = new Date(`${customTo}T23:59:59`);
}

  try {
    const ordersResult = await supabase
      .from("orders")
      .select("id,order_number,status,total,created_at")
      .gte(
        "created_at",
        (fromDate || new Date(0)).toISOString()
      )
      .lte(
        "created_at",
        (toDate || new Date()).toISOString()
      );

    if (ordersResult.error) throw ordersResult.error;

    const orders = ordersResult.data || [];
    const orderIds = orders.map((order) => Number(order.id));

    const [
      orderItemsResult,
      paymentsResult,
      productsResult,
      expensesResult,
    ] = await Promise.all([
      orderIds.length > 0
        ? supabase
            .from("order_items")
            .select(
              "order_id,product_id,product_name,quantity,cost_price_at_sale"
            )
            .in("order_id", orderIds)
        : Promise.resolve({ data: [], error: null }),

      supabase
        .from("payments")
        .select("status")
        .gte("created_at", fromDate!.toISOString())
        .lte("created_at", toDate!.toISOString()),

      supabase
        .from("products")
        .select("id,stock,cost_price"),

      supabase
        .from("expenses")
        .select("amount")
        .gte(
          "expense_date",
          fromDate!.toISOString().slice(0, 10)
        )
        .lte(
          "expense_date",
          toDate!.toISOString().slice(0, 10)
        ),
    ]);

    if (orderItemsResult.error) throw orderItemsResult.error;
    if (paymentsResult.error) throw paymentsResult.error;
    if (productsResult.error) throw productsResult.error;
    if (expensesResult.error) throw expensesResult.error;

    const orderItems = orderItemsResult.data || [];
    const payments = paymentsResult.data || [];
    const products = productsResult.data || [];
    const expenses = expensesResult.data || [];

    const productCostMap = new Map(
      products.map((product) => [
        Number(product.id),
        Number(product.cost_price || 0),
      ])
    );

    const revenue = orders
      .filter((order) => order.status !== "Cancelled")
      .reduce(
        (sum, order) => sum + Number(order.total || 0),
        0
      );

const cogs = orderItems.reduce((sum, item) => {
  const costPrice =
    Number(item.cost_price_at_sale || 0) ||
    Number(productCostMap.get(Number(item.product_id)) || 0);

  return (
    sum +
    costPrice * Number(item.quantity || 0)
  );
}, 0);
    const grossProfit = revenue - cogs;

    const totalExpenses = expenses.reduce((sum, expense) => {
      return sum + Number(expense.amount || 0);
    }, 0);

    const netProfit = grossProfit - totalExpenses;

    const pendingOrders = orders.filter(
      (order) =>
        order.status === "Pending" ||
        order.status === "Processing"
    ).length;

    const pendingPayments = payments.filter(
      (payment: any) =>
        payment.status === "Pending" ||
        payment.status === "Processing"
    ).length;

    const lowStock = products.filter(
      (product) =>
        Number(product.stock || 0) > 0 &&
        Number(product.stock || 0) <= 5
    ).length;

    const outOfStock = products.filter(
      (product) => Number(product.stock || 0) <= 0
    ).length;

    return NextResponse.json({
      success: true,

      summary: {
        orders: orders.length,
        revenue,
        cogs,
        grossProfit,
        expenses: totalExpenses,
        netProfit,
        pendingOrders,
        pendingPayments,
        lowStock,
        outOfStock,
        products: products.length,
      },

      orders,
      orderItems,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load dashboard",
      },
      { status: 500 }
    );
  }
}
