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
    const ordersResult = await supabase
      .from("orders")
      .select("*")
      .gte(
        "created_at",
        (fromDate || new Date(0)).toISOString()
      )
      .lte(
        "created_at",
        (toDate || new Date()).toISOString()
      );

    if (ordersResult.error) {
      throw ordersResult.error;
    }

    const orders = ordersResult.data || [];

    const orderIds = orders.map((order) =>
      Number(order.id)
    );

    const [
      orderItemsResult,
      paymentsResult,
      orderPaymentsResult,
      productsResult,
      expensesResult,
    ] = await Promise.all([
      orderIds.length > 0
        ? supabase
            .from("order_items")
            .select(
              "order_id,product_id,product_name,quantity,cost_price_at_sale,price"
            )
            .in("order_id", orderIds)
        : Promise.resolve({
            data: [],
            error: null,
          }),

      supabase
        .from("payments")
        .select("*")
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

      (() => {
        const orderNumbers = (ordersResult.data || [])
          .map((order: any) => order.order_number)
          .filter(Boolean);

        return orderNumbers.length > 0
          ? supabase
              .from("payments")
              .select("*")
              .in("order_number", orderNumbers)
              .order("created_at", {
                ascending: false,
              })
          : Promise.resolve({
              data: [],
              error: null,
            });
      })(),

      supabase
        .from("products")
        .select(
          "id,name,stock,price,cost_price"
        ),

      supabase
        .from("expenses")
        .select("*")
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

    if (orderItemsResult.error) {
      throw orderItemsResult.error;
    }

    if (paymentsResult.error) {
      throw paymentsResult.error;
    }

    if (orderPaymentsResult.error) {
      throw orderPaymentsResult.error;
    }

    if (productsResult.error) {
      throw productsResult.error;
    }

    if (expensesResult.error) {
      throw expensesResult.error;
    }

    const orderItems =
      orderItemsResult.data || [];

    const payments =
      paymentsResult.data || [];

    const orderPayments =
      orderPaymentsResult.data || [];

    const products =
      productsResult.data || [];

    const expenses =
      expensesResult.data || [];

    /*
     * SINGLE ACCOUNTING ENGINE
     */
    const accounting = calculateAccounting({
      orders,
      orderItems,
      products,
      payments,
      orderPayments,
      expenses,
    });

    return NextResponse.json({
      success: true,

      summary: accounting,

      orders,
      orderItems,
      products,
      payments,
      expenses,

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
