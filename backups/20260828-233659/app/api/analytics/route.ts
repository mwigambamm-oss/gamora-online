import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let ordersQuery = supabase
      .from("orders")
      .select("*")
      .neq("status", "Cancelled");

    let expensesQuery = supabase
      .from("expenses")
      .select("*");

    if (from) {
      ordersQuery = ordersQuery.gte(
        "created_at",
        from
      );

      expensesQuery = expensesQuery.gte(
        "expense_date",
        from
      );
    }

    if (to) {
      ordersQuery = ordersQuery.lte(
        "created_at",
        to
      );

      expensesQuery = expensesQuery.lte(
        "expense_date",
        to
      );
    }

    const [
      ordersResult,
      productsResult,
      costsResult,
      expensesResult,
      paymentsResult,
    ] = await Promise.all([
      ordersQuery,
      supabase.from("products").select("*"),
      supabase.from("product_costs").select("*"),
      expensesQuery,
      supabase.from("payments").select("*"),
    ]);

    if (ordersResult.error)
      throw ordersResult.error;

    if (productsResult.error)
      throw productsResult.error;

    if (costsResult.error)
      throw costsResult.error;

    if (expensesResult.error)
      throw expensesResult.error;

    if (paymentsResult.error)
      throw paymentsResult.error;


    const orders = ordersResult.data || [];
    const products = productsResult.data || [];
    const costs = costsResult.data || [];
    const expenses = expensesResult.data || [];
    const payments = paymentsResult.data || [];


    /*
     * COST SOURCE
     * 1. product_costs is used when a historical cost exists.
     * 2. products.cost_price is the default/current buying price.
     * This prevents COGS from incorrectly becoming zero.
     */
    const costMap = new Map<number, number>();

    products.forEach((p:any) => {
      costMap.set(
        Number(p.id),
        Number(p.cost_price || 0)
      );
    });

    costs.forEach((c:any) => {
      const productId = Number(c.product_id);
      const costPrice = Number(c.cost_price || 0);

      if (productId && costPrice > 0) {
        costMap.set(productId, costPrice);
      }
    });


    let revenue = 0;
    let deliveryIncome = 0;
    let cogs = 0;


    const productPerformance:any = {};


    for (const order of orders){

      revenue += Number(
        order.subtotal || 0
      );

      deliveryIncome += Number(
        order.delivery_fee || 0
      );


      const items =
        Array.isArray(order.items)
        ? order.items
        : [];


      for(const item of items){

        const qty =
          Number(item.quantity || 0);

        const sell =
          Number(item.price || 0);

        const cost =
          costMap.get(
            Number(item.id)
          ) || 0;


        cogs += cost * qty;


        if(!productPerformance[item.id]){
          productPerformance[item.id]={
            name:item.name,
            quantity:0,
            sales:0,
            cost:0,
            profit:0
          };
        }


        productPerformance[item.id].quantity += qty;

        productPerformance[item.id].sales +=
          sell * qty;

        productPerformance[item.id].cost +=
          cost * qty;

        productPerformance[item.id].profit +=
          (sell-cost)*qty;
      }
    }


    const totalExpenses =
      expenses.reduce(
        (a:any,b:any)=>
          a + Number(b.amount || 0),
        0
      );


    const grossProfit =
      revenue - cogs;


    const netProfit =
      grossProfit - totalExpenses;


    const profitMargin =
      revenue > 0
      ? (netProfit / revenue) * 100
      : 0;


    const stockCostValue =
      products.reduce(
        (sum:any,p:any)=>
          sum +
          Number(p.stock || 0) *
          (costMap.get(Number(p.id)) || 0),
        0
      );


    const stockSellingValue =
      products.reduce(
        (sum:any,p:any)=>
          sum +
          Number(p.stock || 0) *
          Number(p.price || 0),
        0
      );


    const topProducts =
      Object.values(productPerformance)
      .sort(
        (a:any,b:any)=>
          b.profit-a.profit
      )
      .slice(0,10);


    const paidAmount =
      payments
      .filter(
        (p:any)=>
        p.payment_status==="Paid"
      )
      .reduce(
        (a:any,b:any)=>
        a+Number(b.amount||0),
        0
      );


    const merchandiseRevenue = revenue;


    const unpaidAmount =
      Math.max(
        revenue + deliveryIncome - paidAmount,
        0
      );


    return NextResponse.json({

      success:true,

      kpis:{
        orders:orders.length,

        revenue,

        deliveryIncome,

        merchandiseRevenue: revenue,

        cogs,

        merchandiseGrossProfit: grossProfit,

        grossProfit,

        expenses:totalExpenses,

        netProfit,

        profitMargin,

        stockCostValue,

        stockSellingValue,

        paidAmount:
          payments
          .filter(
            (p:any)=>
            p.payment_status==="Paid"
          )
          .reduce(
            (a:any,b:any)=>
            a + Number(b.amount || 0),
            0
          ),

        unpaidAmount:
          Math.max(
            0,
            orders.reduce(
              (a:any,b:any)=>
                a + Number(b.total || 0),
              0
            ) -
            payments
              .filter(
                (p:any)=>
                  p.payment_status === "Paid"
              )
              .reduce(
                (a:any,b:any)=>
                  a + Number(b.amount || 0),
                0
              )
          )
      },


      topProducts,

      lowStock:
        products.filter(
          (p:any)=>
          Number(p.stock)<=5
        )

    });


  } catch(error:any){

    console.error(
      "Analytics error:",
      error
    );

    return NextResponse.json(
      {
        success:false,
        error:error.message
      },
      {
        status:500
      }
    );
  }
}
