import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
} from "docx";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "excel";
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let ordersQuery = supabase
      .from("orders")
      .select("*")
      .neq("status", "Cancelled")
      .order("created_at", { ascending: false });

    let expensesQuery = supabase
      .from("expenses")
      .select("*")
      .order("expense_date", { ascending: false });

    if (from) {
      ordersQuery = ordersQuery.gte("created_at", from);
      expensesQuery = expensesQuery.gte("expense_date", from);
    }

    if (to) {
      ordersQuery = ordersQuery.lte("created_at", `${to}T23:59:59`);
      expensesQuery = expensesQuery.lte("expense_date", to);
    }

    let paymentsQuery = supabase
      .from("payments")
      .select("*")
      .eq("payment_status", "Paid")
      .order("created_at", { ascending: false });

    if (from) {
      paymentsQuery = paymentsQuery.gte("created_at", from);
    }

    if (to) {
      paymentsQuery = paymentsQuery.lte(
        "created_at",
        `${to}T23:59:59`
      );
    }

    const [ordersResult, productsResult, paymentsResult, expensesResult] =
      await Promise.all([
        ordersQuery,
        supabase.from("products").select("*"),
        paymentsQuery,
        expensesQuery,
      ]);

    if (ordersResult.error) throw ordersResult.error;
    if (productsResult.error) throw productsResult.error;
    if (paymentsResult.error) throw paymentsResult.error;
    if (expensesResult.error) throw expensesResult.error;

    const orders = ordersResult.data || [];
    const products = productsResult.data || [];
    const payments = paymentsResult.data || [];
    const expenses = expensesResult.data || [];

    const costMap = new Map<number, number>();

    products.forEach((p: any) => {
      costMap.set(
        Number(p.id),
        Number(p.cost_price || 0)
      );
    });

    let revenue = 0;
    let deliveryIncome = 0;
    let cogs = 0;

    const productMap = new Map<number, any>();

    const orderRows = orders.map((order: any) => {
      const items = Array.isArray(order.items) ? order.items : [];

      let orderCost = 0;

      for (const item of items) {
        const qty = Number(item.quantity || 0);
        const sellingPrice = Number(item.price || 0);
        const buyingPrice =
          costMap.get(Number(item.id)) || 0;

        orderCost += buyingPrice * qty;
        cogs += buyingPrice * qty;

        const existing = productMap.get(Number(item.id)) || {
          id: Number(item.id),
          name: item.name || "Unknown Product",
          quantity: 0,
          sales: 0,
          cost: 0,
          profit: 0,
        };

        existing.quantity += qty;
        existing.sales += sellingPrice * qty;
        existing.cost += buyingPrice * qty;
        existing.profit +=
          (sellingPrice - buyingPrice) * qty;

        productMap.set(Number(item.id), existing);
      }

      revenue += Number(order.subtotal || 0);
      deliveryIncome += Number(order.delivery_fee || 0);

      return {
        Order_Number: order.order_number,
        Date: order.created_at,
        Customer: order.customer_name || "",
        Phone: order.customer_phone || "",
        Status: order.status || "",
        Subtotal_TZS: Number(order.subtotal || 0),
        Delivery_TZS: Number(order.delivery_fee || 0),
        Total_TZS: Number(order.total || 0),
        Product_Cost_TZS: orderCost,
        Gross_Profit_TZS:
          Number(order.subtotal || 0) - orderCost,
        Payment_Status:
          payments.find(
            (p: any) =>
              String(p.order_number) === String(order.order_number) &&
              p.payment_status === "Paid"
          )
            ? "PAID"
            : "UNPAID",
      };
    });

    const totalExpenses = expenses.reduce(
      (sum: number, expense: any) =>
        sum + Number(expense.amount || 0),
      0
    );

    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - totalExpenses;

    const paidAmount = payments
      .filter((p: any) => p.payment_status === "Paid")
      .reduce(
        (sum: number, p: any) =>
          sum + Number(p.amount || 0),
        0
      );

    const unpaidAmount = orders.reduce(
      (sum: number, order: any) => {
        const paid = payments
          .filter(
            (p: any) =>
              String(p.order_number) === String(order.order_number) &&
              p.payment_status === "Paid"
          )
          .reduce(
            (a: number, p: any) =>
              a + Number(p.amount || 0),
            0
          );

        return sum + Math.max(Number(order.total || 0) - paid, 0);
      },
      0
    );

    const stockCostValue = products.reduce(
      (sum: number, p: any) =>
        sum +
        Number(p.stock || 0) *
          Number(p.cost_price || 0),
      0
    );

    const stockSellingValue = products.reduce(
      (sum: number, p: any) =>
        sum +
        Number(p.stock || 0) *
          Number(p.price || 0),
      0
    );

    const summary = [
      {
        Metric: "Orders",
        Amount: orders.length,
      },
      {
        Metric: "Product Revenue",
        Amount_TZS: revenue,
      },
      {
        Metric: "Delivery Income",
        Amount_TZS: deliveryIncome,
      },
      {
        Metric: "Paid Amount",
        Amount_TZS: paidAmount,
      },
      {
        Metric: "Unpaid Amount",
        Amount_TZS: unpaidAmount,
      },
      {
        Metric: "Product Cost / COGS",
        Amount_TZS: cogs,
      },
      {
        Metric: "Gross Profit",
        Amount_TZS: grossProfit,
      },
      {
        Metric: "Expenses",
        Amount_TZS: totalExpenses,
      },
      {
        Metric: "Net Profit",
        Amount_TZS: netProfit,
      },
      {
        Metric: "Stock Cost Value",
        Amount_TZS: stockCostValue,
      },
      {
        Metric: "Stock Selling Value",
        Amount_TZS: stockSellingValue,
      },
      {
        Metric: "Potential Stock Profit",
        Amount_TZS:
          stockSellingValue - stockCostValue,
      },
    ];

    if (format === "word") {
      const summaryTable = new Table({
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph("Metric")],
              }),
              new TableCell({
                children: [new Paragraph("Amount")],
              }),
            ],
          }),
          ...summary.map(
            (row: any) =>
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph(row.Metric),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph(
                        row.Amount !== undefined
                          ? String(row.Amount)
                          : `TZS ${Number(
                              row.Amount_TZS || 0
                            ).toLocaleString()}`
                      ),
                    ],
                  }),
                ],
              })
          ),
        ],
      });

      const orderTable = new Table({
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph("Order")],
              }),
              new TableCell({
                children: [new Paragraph("Customer")],
              }),
              new TableCell({
                children: [new Paragraph("Total")],
              }),
              new TableCell({
                children: [new Paragraph("Payment")],
              }),
              new TableCell({
                children: [new Paragraph("Profit")],
              }),
            ],
          }),
          ...orderRows.map(
            (row: any) =>
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph(
                        String(row.Order_Number)
                      ),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph(
                        String(row.Customer)
                      ),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph(
                        `TZS ${Number(
                          row.Total_TZS
                        ).toLocaleString()}`
                      ),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph(
                        String(row.Payment_Status)
                      ),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph(
                        `TZS ${Number(
                          row.Gross_Profit_TZS
                        ).toLocaleString()}`
                      ),
                    ],
                  }),
                ],
              })
          ),
        ],
      });

      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                text: "GAMORA ONLINE BUSINESS REPORT",
                heading: HeadingLevel.TITLE,
              }),
              new Paragraph(
                `Period: ${from || "All"} to ${to || "All"}`
              ),
              new Paragraph(""),
              new Paragraph({
                text: "Financial Summary",
                heading: HeadingLevel.HEADING_1,
              }),
              summaryTable,
              new Paragraph(""),
              new Paragraph({
                text: "Orders",
                heading: HeadingLevel.HEADING_1,
              }),
              orderTable,
            ],
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition":
            'attachment; filename="GAMORA-Business-Report.docx"',
        },
      });
    }

    const workbook = XLSX.utils.book_new();

    const summarySheet =
      XLSX.utils.json_to_sheet(summary);

    const ordersSheet =
      XLSX.utils.json_to_sheet(orderRows);

    const productsSheet =
      XLSX.utils.json_to_sheet(
        Array.from(productMap.values())
      );

    const expensesSheet =
      XLSX.utils.json_to_sheet(expenses);

    const stockSheet =
      XLSX.utils.json_to_sheet(products.map((p: any) => ({
        ID: p.id,
        Product: p.name,
        Category: p.category,
        Stock: p.stock,
        Buying_Price_TZS: p.cost_price || 0,
        Selling_Price_TZS: p.price || 0,
        Stock_Cost_Value_TZS:
          Number(p.stock || 0) *
          Number(p.cost_price || 0),
        Stock_Selling_Value_TZS:
          Number(p.stock || 0) *
          Number(p.price || 0),
        Potential_Profit_TZS:
          Number(p.stock || 0) *
          (Number(p.price || 0) -
            Number(p.cost_price || 0)),
      })));

    XLSX.utils.book_append_sheet(
      workbook,
      summarySheet,
      "Financial Summary"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      ordersSheet,
      "Orders"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      productsSheet,
      "Product Performance"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      expensesSheet,
      "Expenses"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      stockSheet,
      "Stock"
    );

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="GAMORA-Business-Report.xlsx"',
      },
    });
  } catch (error: any) {
    console.error("Report generation error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to generate report",
      },
      { status: 500 }
    );
  }
}
