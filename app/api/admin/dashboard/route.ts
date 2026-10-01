import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { calculateAccounting } from "@/lib/accounting/calculations";

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
    const dashboardStart = performance.now();

    /*
     * Run independent dashboard queries in parallel.
     * This avoids waiting for the orders query before starting
     * products, payments and expenses.
     */
    const [
      ordersResult,
      paymentsResult,
      productsResult,
      expensesResult,
    ] = await Promise.all([
      supabase
        .from("orders")
        .select(
          "id,order_number,status,subtotal,delivery_fee,total,created_at"
        )
        .gte(
          "created_at",
          (fromDate || new Date(0)).toISOString()
        )
        .lte(
          "created_at",
          (toDate || new Date()).toISOString()
        )
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("payments")
        .select(
          "id,order_number,amount,payment_status,payment_method,created_at"
        )
        .gte(
          "created_at",
          (fromDate || new Date(0)).toISOString()
        )
        .lte(
          "created_at",
          (toDate || new Date()).toISOString()
        )
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("products")
        .select(
          "id,name,stock,price,cost_price"
        ),

      supabase
        .from("expenses")
        .select("amount,category,expense_date")
        .gte(
          "expense_date",
          (fromDate || new Date(0))
            .toISOString()
            .slice(0, 10)
        )
        .lte(
          "expense_date",
          (toDate || new Date())
            .toISOString()
            .slice(0, 10)
        ),
    ]);

    if (ordersResult.error) {
      throw ordersResult.error;
    }

    if (paymentsResult.error) {
      throw paymentsResult.error;
    }

    if (productsResult.error) {
      throw productsResult.error;
    }

    if (expensesResult.error) {
      throw expensesResult.error;
    }

    console.log(
      `[Dashboard Timing] parallel queries: ${(performance.now() - dashboardStart).toFixed(0)}ms`
    );

    const orders = ordersResult.data || [];

    const orderIds = orders.map((order) =>
      Number(order.id)
    );

    const orderNumbers = orders
      .map((order: any) => order.order_number)
      .filter(Boolean);

    /*
     * These two queries depend on the selected orders,
     * so run them after orders are available.
     */
    const orderItemsStart = performance.now();

    let orderItems: any[] = [];
    let orderPayments: any[] = [];

    if (orderIds.length > 0) {
      const orderItemsResult = await supabase
        .from("order_items")
        .select(
          "order_id,product_id,product_name,quantity,cost_price_at_sale,price"
        )
        .in("order_id", orderIds);

      if (orderItemsResult.error) {
        throw orderItemsResult.error;
      }

      orderItems = orderItemsResult.data || [];
    }

    if (orderNumbers.length > 0) {
      const orderPaymentsResult = await supabase
        .from("payments")
        .select(
          "id,order_number,amount,payment_status,payment_method,created_at"
        )
        .in("order_number", orderNumbers)
        .order("created_at", {
          ascending: false,
        });

      if (orderPaymentsResult.error) {
        throw orderPaymentsResult.error;
      }

      orderPayments = orderPaymentsResult.data || [];
    }

    console.log(
      `[Dashboard Timing] dependent queries: ${(performance.now() - orderItemsStart).toFixed(0)}ms`
    );

    const payments =
      paymentsResult.data || [];

    const products =
      productsResult.data || [];

    const expenses =
      expensesResult.data || [];

    /*
     * SINGLE ACCOUNTING ENGINE
     */
    const accountingStart = performance.now();

    const accounting = calculateAccounting({
      orders,
      orderItems,
      products,
      payments,
      orderPayments,
      expenses,
    });

    /*
     * Keep all records above for accurate server-side accounting,
     * but do NOT send the entire dataset to the browser.
     * The admin dashboard only needs a small recent/display subset.
     */
    console.log(
      `[Dashboard Timing] accounting: ${(performance.now() - accountingStart).toFixed(0)}ms`
    );
    console.log(
      `[Dashboard Timing] TOTAL: ${(performance.now() - dashboardStart).toFixed(0)}ms`
    );

    const dashboardOrders = orders
      .slice()
      .sort(
        (a: any, b: any) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
      )
      .slice(0, 50);

    const dashboardOrderItems = orderItems.slice(0, 100);

    const dashboardPayments = payments
      .slice()
      .sort(
        (a: any, b: any) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
      )
      .slice(0, 50);

    const dashboardExpenses = expenses
      .slice()
      .sort(
        (a: any, b: any) =>
          String(b.expense_date || "").localeCompare(
            String(a.expense_date || "")
          )
      )
      .slice(0, 50);

    const dashboardProducts = products.filter(
      (product: any) =>
        Number(product.stock || 0) <= 5
    );

    return NextResponse.json({
      success: true,

      summary: accounting,

      orders: dashboardOrders,
      orderItems: dashboardOrderItems,
      products: dashboardProducts,
      payments: dashboardPayments,
      expenses: dashboardExpenses,

      period: {
        name: period,
        from: fromDate?.toISOString() || null,
        to: toDate?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error(
      "Admin dashboard error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : JSON.stringify(error),
      },
      {
        status: 500,
      }
    );
  }
}
