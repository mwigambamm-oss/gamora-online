import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  ImageRun,
  WidthType,
  AlignmentType,
} from "docx";
import { supabase } from "@/lib/supabase";

type ReportType =
  | "summary"
  | "sales"
  | "products"
  | "inventory"
  | "payments"
  | "expenses"
  | "profit-loss";

const REPORT_NAMES: Record<ReportType, string> = {
  summary: "Business Summary",
  sales: "Sales & Orders",
  products: "Product Performance",
  inventory: "Inventory / Stock",
  payments: "Payments",
  expenses: "Expenses",
  "profit-loss": "Profit & Loss",
};

function money(value: number) {
  return `TZS ${Number(value || 0).toLocaleString()}`;
}

function dateLabel(value?: string | null) {
  if (!value) return "All Time";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getLogoBuffer() {
  try {
    const fs = require("fs");
    const path = require("path");
    const file = path.join(process.cwd(), "public", "gamora-logo.png");

    return fs.readFileSync(file);
  } catch (error) {
    console.error("Logo loading error:", error);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const format = searchParams.get("format") || "excel";
    const type = (searchParams.get("type") || "summary") as ReportType;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!REPORT_NAMES[type]) {
      return NextResponse.json(
        { success: false, error: "Invalid report type." },
        { status: 400 }
      );
    }

    if (!["pdf", "word", "excel"].includes(format)) {
      return NextResponse.json(
        { success: false, error: "Invalid report format." },
        { status: 400 }
      );
    }

    let ordersQuery = supabase
      .from("orders")
      .select("*")
      .neq("status", "Cancelled")
      .order("created_at", { ascending: false });

    let expensesQuery = supabase
      .from("expenses")
      .select("*")
      .order("expense_date", { ascending: false });

    let paymentsQuery = supabase
      .from("payments")
      .select("*")
      .eq("payment_status", "Paid")
      .order("created_at", { ascending: false });

    const productsQuery = supabase
      .from("products")
      .select("*")
      .order("id", { ascending: false });

    if (from) {
      ordersQuery = ordersQuery.gte("created_at", from);
      expensesQuery = expensesQuery.gte("expense_date", from);
      paymentsQuery = paymentsQuery.gte("created_at", from);
    }

    if (to) {
      ordersQuery = ordersQuery.lte("created_at", `${to}T23:59:59`);
      expensesQuery = expensesQuery.lte("expense_date", to);
      paymentsQuery = paymentsQuery.lte("created_at", `${to}T23:59:59`);
    }

    const [
      ordersResult,
      productsResult,
      paymentsResult,
      expensesResult,
    ] = await Promise.all([
      ordersQuery,
      productsQuery,
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

    products.forEach((product: any) => {
      costMap.set(
        Number(product.id),
        Number(product.cost_price || 0)
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
        const id = Number(item.id);
        const qty = Number(item.quantity || 0);
        const sellingPrice = Number(item.price || 0);
        const buyingPrice = costMap.get(id) || 0;

        orderCost += buyingPrice * qty;
        cogs += buyingPrice * qty;

        const existing = productMap.get(id) || {
          ID: id,
          Product: item.name || "Unknown Product",
          Quantity_Sold: 0,
          Sales_TZS: 0,
          Cost_TZS: 0,
          Profit_TZS: 0,
        };

        existing.Quantity_Sold += qty;
        existing.Sales_TZS += sellingPrice * qty;
        existing.Cost_TZS += buyingPrice * qty;
        existing.Profit_TZS +=
          (sellingPrice - buyingPrice) * qty;

        productMap.set(id, existing);
      }

      revenue += Number(order.subtotal || 0);
      deliveryIncome += Number(order.delivery_fee || 0);

      const paid = payments
        .filter(
          (payment: any) =>
            String(payment.order_number) ===
              String(order.order_number) &&
            payment.payment_status === "Paid"
        )
        .reduce(
          (sum: number, payment: any) =>
            sum + Number(payment.amount || 0),
          0
        );

      return {
        Order_Number: order.order_number || "",
        Date: order.created_at || "",
        Customer: order.customer_name || "",
        Phone: order.customer_phone || "",
        Status: order.status || "",
        Subtotal_TZS: Number(order.subtotal || 0),
        Delivery_TZS: Number(order.delivery_fee || 0),
        Total_TZS: Number(order.total || 0),
        Paid_TZS: paid,
        Balance_TZS: Math.max(
          Number(order.total || 0) - paid,
          0
        ),
        Product_Cost_TZS: orderCost,
        Gross_Profit_TZS:
          Number(order.subtotal || 0) - orderCost,
        Payment_Status: paid > 0 ? "PAID" : "UNPAID",
      };
    });

    const totalExpenses = expenses.reduce(
      (sum: number, expense: any) =>
        sum + Number(expense.amount || 0),
      0
    );

    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - totalExpenses;

    const paidAmount = payments.reduce(
      (sum: number, payment: any) =>
        sum + Number(payment.amount || 0),
      0
    );

    const unpaidAmount = orderRows.reduce(
      (sum: number, order: any) =>
        sum + Number(order.Balance_TZS || 0),
      0
    );

    const stockRows = products.map((product: any) => {
      const stock = Number(product.stock || 0);
      const cost = Number(product.cost_price || 0);
      const price = Number(product.price || 0);

      return {
        ID: product.id,
        Product: product.name || "",
        Category: product.category || "",
        Stock: stock,
        Buying_Price_TZS: cost,
        Selling_Price_TZS: price,
        Stock_Cost_Value_TZS: stock * cost,
        Stock_Selling_Value_TZS: stock * price,
        Potential_Profit_TZS: stock * (price - cost),
      };
    });

    const stockCostValue = stockRows.reduce(
      (sum, row) => sum + row.Stock_Cost_Value_TZS,
      0
    );

    const stockSellingValue = stockRows.reduce(
      (sum, row) => sum + row.Stock_Selling_Value_TZS,
      0
    );

    const summaryRows: Array<[string, string | number]> = [
      ["Orders", orders.length],
      ["Products", products.length],
      ["Product Revenue", revenue],
      ["Delivery Income", deliveryIncome],
      ["Paid Amount", paidAmount],
      ["Unpaid Amount", unpaidAmount],
      ["Product Cost / COGS", cogs],
      ["Gross Profit", grossProfit],
      ["Expenses", totalExpenses],
      ["Net Profit", netProfit],
      ["Stock Cost Value", stockCostValue],
      ["Stock Selling Value", stockSellingValue],
      [
        "Potential Stock Profit",
        stockSellingValue - stockCostValue,
      ],
    ];

    const productRows = Array.from(productMap.values());

    const paymentRows = payments.map((payment: any) => ({
      Payment_ID: payment.id || "",
      Date: payment.created_at || "",
      Order_Number: payment.order_number || "",
      Amount_TZS: Number(payment.amount || 0),
      Payment_Status: payment.payment_status || "",
      Method: payment.payment_method || "",
    }));

    const expenseRows = expenses.map((expense: any) => ({
      ID: expense.id || "",
      Date: expense.expense_date || "",
      Description: expense.description || expense.name || "",
      Category: expense.category || "",
      Amount_TZS: Number(expense.amount || 0),
    }));

    const reportTitle = REPORT_NAMES[type];
    const periodLabel = `${dateLabel(from)} - ${dateLabel(to)}`;

    // ------------------------------------------------------------------
    // PDF
    // ------------------------------------------------------------------

    if (format === "pdf") {
      const logo = getLogoBuffer();

      const chunks: Buffer[] = [];

      const doc = new PDFDocument({
        size: "A4",
        margin: 42,
        bufferPages: true,
        info: {
          Title: `GAMORA ONLINE - ${reportTitle}`,
          Author: "GAMORA ONLINE",
        },
      });

      doc.on("data", (chunk: Buffer) => chunks.push(chunk));

      const done = new Promise<Buffer>((resolve, reject) => {
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);
      });

      if (logo) {
        try {
          doc.image(logo, 42, 35, {
            fit: [90, 55],
          });
        } catch {}
      }

      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .fillColor("#800020")
        .text("GAMORA ONLINE", 145, 43);

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#666666")
        .text("Online Marketplace", 145, 68);

      doc
        .fontSize(18)
        .font("Helvetica-Bold")
        .fillColor("#222222")
        .text(reportTitle, 42, 115);

      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#666666")
        .text(`Reporting Period: ${periodLabel}`, 42, 141);

      doc
        .text(
          `Generated: ${new Date().toLocaleString("en-GB")}`,
          42,
          156
        );

      doc
        .moveTo(42, 177)
        .lineTo(553, 177)
        .strokeColor("#800020")
        .lineWidth(2)
        .stroke();

      let y = 198;

      const addSectionTitle = (title: string) => {
        if (y > 730) {
          doc.addPage();
          y = 45;
        }

        doc
          .fontSize(13)
          .font("Helvetica-Bold")
          .fillColor("#800020")
          .text(title, 42, y);

        y += 25;
      };

      const addRow = (
        label: string,
        value: string,
        bold = false
      ) => {
        if (y > 750) {
          doc.addPage();
          y = 45;
        }

        doc
          .fontSize(9)
          .font(bold ? "Helvetica-Bold" : "Helvetica")
          .fillColor("#222222")
          .text(label, 50, y, { width: 280 });

        doc
          .text(value, 340, y, {
            width: 190,
            align: "right",
          });

        y += 20;
      };

      if (type === "summary" || type === "profit-loss") {
        addSectionTitle(
          type === "summary"
            ? "Business Summary"
            : "Profit & Loss"
        );

        for (const [label, value] of summaryRows) {
          const numeric =
            typeof value === "number" &&
            !["Orders", "Products"].includes(label);

          addRow(
            label,
            numeric
              ? money(value)
              : Number(value).toLocaleString(),
            ["Gross Profit", "Net Profit"].includes(label)
          );
        }
      }

      if (type === "sales" || type === "summary") {
        addSectionTitle("Sales & Orders");

        const rows =
          type === "sales" ? orderRows : orderRows.slice(0, 100);

        addRow("Total Orders", orders.length.toLocaleString());
        addRow("Product Revenue", money(revenue));
        addRow("Delivery Income", money(deliveryIncome));
        addRow("Paid Amount", money(paidAmount));
        addRow("Unpaid Amount", money(unpaidAmount));

        y += 10;

        for (const row of rows) {
          if (y > 700) {
            doc.addPage();
            y = 45;
          }

          doc
            .fontSize(8)
            .font("Helvetica-Bold")
            .fillColor("#800020")
            .text(
              `${row.Order_Number}  |  ${row.Customer}`,
              42,
              y
            );

          y += 13;

          doc
            .fontSize(8)
            .font("Helvetica")
            .fillColor("#333333")
            .text(
              `${dateLabel(row.Date)}   ${money(row.Total_TZS)}   ${row.Payment_Status}   Profit: ${money(row.Gross_Profit_TZS)}`,
              42,
              y
            );

          y += 20;
        }
      }

      if (type === "products") {
        addSectionTitle("Product Performance");

        for (const row of productRows) {
          if (y > 700) {
            doc.addPage();
            y = 45;
          }

          doc
            .fontSize(8)
            .font("Helvetica-Bold")
            .fillColor("#800020")
            .text(
              `${row.Product}  |  Qty: ${row.Quantity_Sold}`,
              42,
              y,
              { width: 500 }
            );

          y += 13;

          doc
            .fontSize(8)
            .font("Helvetica")
            .fillColor("#333333")
            .text(
              `Sales: ${money(row.Sales_TZS)}   Cost: ${money(row.Cost_TZS)}   Profit: ${money(row.Profit_TZS)}`,
              42,
              y
            );

          y += 20;
        }
      }

      if (type === "inventory") {
        addSectionTitle("Inventory / Stock");

        addRow("Stock Cost Value", money(stockCostValue));
        addRow("Stock Selling Value", money(stockSellingValue));
        addRow(
          "Potential Stock Profit",
          money(stockSellingValue - stockCostValue),
          true
        );

        y += 10;

        for (const row of stockRows) {
          if (y > 700) {
            doc.addPage();
            y = 45;
          }

          doc
            .fontSize(8)
            .font("Helvetica-Bold")
            .fillColor("#800020")
            .text(
              `${row.Product}  |  Stock: ${row.Stock}`,
              42,
              y
            );

          y += 13;

          doc
            .fontSize(8)
            .font("Helvetica")
            .fillColor("#333333")
            .text(
              `Buying: ${money(row.Buying_Price_TZS)}   Selling: ${money(row.Selling_Price_TZS)}   Stock Value: ${money(row.Stock_Selling_Value_TZS)}`,
              42,
              y
            );

          y += 20;
        }
      }

      if (type === "payments") {
        addSectionTitle("Payments");

        addRow("Total Paid", money(paidAmount), true);

        for (const row of paymentRows) {
          if (y > 700) {
            doc.addPage();
            y = 45;
          }

          doc
            .fontSize(8)
            .font("Helvetica-Bold")
            .fillColor("#800020")
            .text(
              `${row.Order_Number}  |  ${money(row.Amount_TZS)}`,
              42,
              y
            );

          y += 13;

          doc
            .fontSize(8)
            .font("Helvetica")
            .fillColor("#333333")
            .text(
              `${dateLabel(row.Date)}   ${row.Method || "Payment"}   ${row.Payment_Status}`,
              42,
              y
            );

          y += 20;
        }
      }

      if (type === "expenses") {
        addSectionTitle("Expenses");

        addRow("Total Expenses", money(totalExpenses), true);

        for (const row of expenseRows) {
          if (y > 700) {
            doc.addPage();
            y = 45;
          }

          doc
            .fontSize(8)
            .font("Helvetica-Bold")
            .fillColor("#800020")
            .text(
              `${dateLabel(row.Date)}  |  ${money(row.Amount_TZS)}`,
              42,
              y
            );

          y += 13;

          doc
            .fontSize(8)
            .font("Helvetica")
            .fillColor("#333333")
            .text(
              `${row.Description}  ${row.Category ? `| ${row.Category}` : ""}`,
              42,
              y
            );

          y += 20;
        }
      }

      const pages = doc.bufferedPageRange();

      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);

        doc
          .fontSize(7)
          .fillColor("#888888")
          .text(
            `GAMORA ONLINE  •  ${reportTitle}  •  Page ${i + 1} of ${pages.count}`,
            42,
            805,
            {
              width: 510,
              align: "center",
            }
          );
      }

      doc.end();

      const buffer = await done;

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="GAMORA-${type}-Report.pdf"`,
        },
      });
    }

    // ------------------------------------------------------------------
    // WORD
    // ------------------------------------------------------------------

    if (format === "word") {
      const logo = getLogoBuffer();

      const children: any[] = [];

      if (logo) {
        try {
          children.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new ImageRun({
                  data: logo,
                  transformation: {
                    width: 150,
                    height: 70,
                  },
                  type: "png",
                }),
              ],
            })
          );
        } catch {}
      }

      children.push(
        new Paragraph({
          text: "GAMORA ONLINE",
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          text: reportTitle,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          text: `Reporting Period: ${periodLabel}`,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          text: `Generated: ${new Date().toLocaleString("en-GB")}`,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph("")
      );

      const addWordTable = (
        title: string,
        headers: string[],
        rows: Array<Array<string | number>>
      ) => {
        children.push(
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
          })
        );

        children.push(
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: [
              new TableRow({
                children: headers.map(
                  (header) =>
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: header,
                        }),
                      ],
                    })
                ),
              }),
              ...rows.map(
                (row) =>
                  new TableRow({
                    children: row.map(
                      (value) =>
                        new TableCell({
                          children: [
                            new Paragraph({
                              text: String(value),
                            }),
                          ],
                        })
                    ),
                  })
              ),
            ],
          })
        );

        children.push(new Paragraph(""));
      };

      if (type === "summary" || type === "profit-loss") {
        addWordTable(
          type === "summary"
            ? "Business Summary"
            : "Profit & Loss",
          ["Metric", "Amount"],
          summaryRows.map(([label, value]) => [
            label,
            typeof value === "number" &&
            !["Orders", "Products"].includes(label)
              ? money(value)
              : Number(value).toLocaleString(),
          ])
        );
      }

      if (type === "sales") {
        addWordTable(
          "Sales & Orders",
          ["Order", "Customer", "Total", "Payment", "Profit"],
          orderRows.map((row) => [
            String(row.Order_Number),
            String(row.Customer),
            money(row.Total_TZS),
            String(row.Payment_Status),
            money(row.Gross_Profit_TZS),
          ])
        );
      }

      if (type === "products") {
        addWordTable(
          "Product Performance",
          ["Product", "Qty", "Sales", "Cost", "Profit"],
          productRows.map((row) => [
            String(row.Product),
            String(row.Quantity_Sold),
            money(row.Sales_TZS),
            money(row.Cost_TZS),
            money(row.Profit_TZS),
          ])
        );
      }

      if (type === "inventory") {
        addWordTable(
          "Inventory / Stock",
          ["Product", "Stock", "Buying", "Selling", "Stock Value"],
          stockRows.map((row) => [
            String(row.Product),
            String(row.Stock),
            money(row.Buying_Price_TZS),
            money(row.Selling_Price_TZS),
            money(row.Stock_Selling_Value_TZS),
          ])
        );
      }

      if (type === "payments") {
        addWordTable(
          "Payments",
          ["Date", "Order", "Amount", "Status", "Method"],
          paymentRows.map((row) => [
            dateLabel(row.Date),
            String(row.Order_Number),
            money(row.Amount_TZS),
            String(row.Payment_Status),
            String(row.Method || ""),
          ])
        );
      }

      if (type === "expenses") {
        addWordTable(
          "Expenses",
          ["Date", "Description", "Category", "Amount"],
          expenseRows.map((row) => [
            dateLabel(row.Date),
            String(row.Description),
            String(row.Category),
            money(row.Amount_TZS),
          ])
        );
      }

      const document = new Document({
        creator: "GAMORA ONLINE",
        title: `${reportTitle} - GAMORA ONLINE`,
        description: "GAMORA ONLINE business report",
        sections: [
          {
            properties: {},
            children,
          },
        ],
      });

      const buffer = await Packer.toBuffer(document);

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="GAMORA-${type}-Report.docx"`,
        },
      });
    }

    // ------------------------------------------------------------------
    // EXCEL
    // ------------------------------------------------------------------

    const workbook = new ExcelJS.Workbook();

    workbook.creator = "GAMORA ONLINE";
    workbook.company = "GAMORA ONLINE";
    workbook.title = reportTitle;

    const sheet = workbook.addWorksheet(reportTitle.slice(0, 31));

    sheet.mergeCells("A1:F1");

    const titleCell = sheet.getCell("A1");
    titleCell.value = "GAMORA ONLINE";
    titleCell.font = {
      name: "Arial",
      size: 20,
      bold: true,
    };
    titleCell.alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    sheet.mergeCells("A2:F2");

    sheet.getCell("A2").value = reportTitle;
    sheet.getCell("A2").font = {
      name: "Arial",
      size: 14,
      bold: true,
    };
    sheet.getCell("A2").alignment = {
      horizontal: "center",
    };

    sheet.mergeCells("A3:F3");
    sheet.getCell("A3").value =
      `Reporting Period: ${periodLabel}`;

    sheet.getCell("A3").alignment = {
      horizontal: "center",
    };

    sheet.mergeCells("A4:F4");
    sheet.getCell("A4").value =
      `Generated: ${new Date().toLocaleString("en-GB")}`;

    sheet.getCell("A4").alignment = {
      horizontal: "center",
    };

    sheet.addRow([]);

    const addExcelTable = (
      title: string,
      headers: string[],
      rows: any[][]
    ) => {
      const titleRow = sheet.addRow([title]);

      titleRow.font = {
        bold: true,
        size: 12,
      };

      const headerRow = sheet.addRow(headers);

      headerRow.font = {
        bold: true,
      };

      headerRow.alignment = {
        vertical: "middle",
      };

      rows.forEach((row) => {
        sheet.addRow(row);
      });

      sheet.addRow([]);
    };

    if (type === "summary" || type === "profit-loss") {
      addExcelTable(
        type === "summary"
          ? "Business Summary"
          : "Profit & Loss",
        ["Metric", "Amount"],
        summaryRows
      );
    }

    if (type === "sales") {
      addExcelTable(
        "Sales & Orders",
        [
          "Order",
          "Date",
          "Customer",
          "Phone",
          "Status",
          "Subtotal",
          "Delivery",
          "Total",
          "Paid",
          "Balance",
          "Cost",
          "Profit",
          "Payment",
        ],
        orderRows.map((row) => [
          row.Order_Number,
          row.Date,
          row.Customer,
          row.Phone,
          row.Status,
          row.Subtotal_TZS,
          row.Delivery_TZS,
          row.Total_TZS,
          row.Paid_TZS,
          row.Balance_TZS,
          row.Product_Cost_TZS,
          row.Gross_Profit_TZS,
          row.Payment_Status,
        ])
      );
    }

    if (type === "products") {
      addExcelTable(
        "Product Performance",
        [
          "ID",
          "Product",
          "Quantity Sold",
          "Sales",
          "Cost",
          "Profit",
        ],
        productRows.map((row) => [
          row.ID,
          row.Product,
          row.Quantity_Sold,
          row.Sales_TZS,
          row.Cost_TZS,
          row.Profit_TZS,
        ])
      );
    }

    if (type === "inventory") {
      addExcelTable(
        "Inventory / Stock",
        [
          "ID",
          "Product",
          "Category",
          "Stock",
          "Buying Price",
          "Selling Price",
          "Stock Cost Value",
          "Stock Selling Value",
          "Potential Profit",
        ],
        stockRows.map((row) => [
          row.ID,
          row.Product,
          row.Category,
          row.Stock,
          row.Buying_Price_TZS,
          row.Selling_Price_TZS,
          row.Stock_Cost_Value_TZS,
          row.Stock_Selling_Value_TZS,
          row.Potential_Profit_TZS,
        ])
      );
    }

    if (type === "payments") {
      addExcelTable(
        "Payments",
        [
          "Payment ID",
          "Date",
          "Order Number",
          "Amount",
          "Status",
          "Method",
        ],
        paymentRows.map((row) => [
          row.Payment_ID,
          row.Date,
          row.Order_Number,
          row.Amount_TZS,
          row.Payment_Status,
          row.Method,
        ])
      );
    }

    if (type === "expenses") {
      addExcelTable(
        "Expenses",
        [
          "ID",
          "Date",
          "Description",
          "Category",
          "Amount",
        ],
        expenseRows.map((row) => [
          row.ID,
          row.Date,
          row.Description,
          row.Category,
          row.Amount_TZS,
        ])
      );
    }

    sheet.columns.forEach((column) => {
      let maxLength = 12;

      column.eachCell?.({ includeEmpty: false }, (cell) => {
        const value = cell.value;
        const length = String(value ?? "").length;

        if (length > maxLength) {
          maxLength = Math.min(length + 2, 45);
        }
      });

      column.width = maxLength;
    });

    sheet.views = [
      {
        state: "frozen",
        ySplit: 6,
      },
    ];

    const excelBuffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(new Uint8Array(excelBuffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="GAMORA-${type}-Report.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error("Report generation error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Failed to generate report.",
      },
      { status: 500 }
    );
  }
}
