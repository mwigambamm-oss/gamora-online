import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "officialgamoraonline@gmail.com";

async function getAuthorizedAdmin() {
  const cookieStore = await cookies();

  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(values) {
          try {
            values.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Cookies may be managed by the proxy.
          }
        },
      },
    }
  );

  const { data, error } = await authClient.auth.getUser();

  if (
    error ||
    !data.user ||
    data.user.email?.toLowerCase() !== ADMIN_EMAIL
  ) {
    return null;
  }

  return data.user;
}

function databaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Server database configuration is missing.");
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function fail(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET() {
  try {
    const admin = await getAuthorizedAdmin();

    if (!admin) {
      return fail("Only the authorized Gamora administrator can access tax management.", 403);
    }

    const db = databaseClient();

    const [
      profileResult,
      rulesResult,
      obligationsResult,
      purchasesResult,
      returnsResult,
      paymentsResult,
      deadlinesResult,
      adjustmentsResult,
      ordersResult,
      orderItemsResult,
      expensesResult,
      salesPaymentsResult,
    ] = await Promise.all([
      db.from("tax_business_profiles").select("*").order("id", { ascending: true }).limit(1),
      db.from("tax_rules").select("*").order("created_at", { ascending: false }).limit(200),
      db.from("tax_obligations").select("*").order("created_at", { ascending: false }).limit(200),
      db.from("supplier_purchases").select("*, supplier_purchase_items(*)").order("purchase_date", { ascending: false }).limit(200),
      db.from("tax_returns").select("*").order("period_end", { ascending: false }).limit(200),
      db.from("tax_payments").select("*").order("payment_date", { ascending: false }).limit(200),
      db.from("tax_deadlines").select("*").order("due_date", { ascending: true }).limit(200),
      db.from("tax_adjustments").select("*").order("created_at", { ascending: false }).limit(200),
      db.from("orders").select("id,order_number,status,subtotal,total,delivery_fee,created_at").order("created_at", { ascending: false }).limit(10000),
      db.from("order_items").select("order_id,order_number,quantity,price,total,cost_price_at_sale,selling_price_at_sale,subtotal,created_at").limit(30000),
      db.from("expenses").select("id,amount,expense_date,category,title").limit(20000),
      db.from("payments").select("order_number,amount,payment_status,created_at").limit(30000),
    ]);

    const results = [
      profileResult,
      rulesResult,
      obligationsResult,
      purchasesResult,
      returnsResult,
      paymentsResult,
      deadlinesResult,
      adjustmentsResult,
      ordersResult,
      orderItemsResult,
      expensesResult,
      salesPaymentsResult,
    ];

    const failed = results.find((result) => result.error);

    if (failed?.error) {
      console.error("Tax management read failed:", failed.error);
      return fail("Unable to load tax records. Check the tax tables and their permissions.", 500);
    }

    // Live sales figures are derived from the existing Gamora records.
    // Cancelled orders are excluded. Supplier stock purchases are not
    // subtracted again here because item-level cost is used as COGS.
    const orders = (ordersResult.data ?? []).filter(
      (order: any) => String(order.status ?? "").toLowerCase() !== "cancelled"
    );
    const orderItems = orderItemsResult.data ?? [];
    const expenses = expensesResult.data ?? [];
    const salesPayments = salesPaymentsResult.data ?? [];

    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    const inRange = (value: unknown, start: Date) => {
      if (!value) return false;
      const date = new Date(String(value));
      return !Number.isNaN(date.getTime()) && date >= start && date <= now;
    };
    const amount = (value: unknown) => {
      const number = Number(value ?? 0);
      return Number.isFinite(number) ? number : 0;
    };

    const itemByOrder = new Map<string, any[]>();
    for (const item of orderItems) {
      const key = String(item.order_id ?? item.order_number ?? "");
      if (!key) continue;
      const list = itemByOrder.get(key) ?? [];
      list.push(item);
      itemByOrder.set(key, list);
    }

    const orderNumbers = new Set(orders.map((order: any) => String(order.order_number ?? "")));
    const validPayments = salesPayments.filter(
      (payment: any) =>
        String(payment.payment_status ?? "").toLowerCase() === "paid" &&
        orderNumbers.has(String(payment.order_number ?? ""))
    );

    const summarize = (start: Date | null) => {
      const selectedOrders = orders.filter(
        (order: any) => !start || inRange(order.created_at, start)
      );
      const selectedIds = new Set(selectedOrders.map((order: any) => String(order.id)));
      let sales = 0;
      let deliveryIncome = 0;
      let cogs = 0;
      let itemRowsCounted = 0;

      for (const order of selectedOrders) {
        const subtotal = Number(order.subtotal);
        const total = amount(order.total);
        const delivery = amount(order.delivery_fee);
        sales += Number.isFinite(subtotal) && subtotal > 0
          ? subtotal
          : Math.max(total - delivery, 0);
        deliveryIncome += delivery;

        const items = itemByOrder.get(String(order.id)) ??
          itemByOrder.get(String(order.order_number ?? "")) ?? [];
        for (const item of items) {
          const qty = Math.max(amount(item.quantity), 0);
          const salePrice = amount(item.selling_price_at_sale ?? item.price);
          const lineSale = amount(item.subtotal ?? item.total) || salePrice * qty;
          const costPrice = amount(item.cost_price_at_sale);
          cogs += costPrice * qty;
          if (lineSale >= 0) itemRowsCounted += 1;
        }
      }

      const selectedExpenses = expenses.filter(
        (expense: any) => !start || inRange(expense.expense_date, start)
      );
      const expenseTotal = selectedExpenses.reduce(
        (sum: number, expense: any) => sum + Math.max(amount(expense.amount), 0), 0
      );
      const selectedPayments = validPayments.filter(
        (payment: any) => selectedIds.has(
          String(orders.find((order: any) =>
            String(order.order_number ?? "") === String(payment.order_number ?? "")
          )?.id ?? "")
        ) && (!start || inRange(payment.created_at, start))
      );
      const cashReceived = selectedPayments.reduce(
        (sum: number, payment: any) => sum + Math.max(amount(payment.amount), 0), 0
      );
      const operatingResult = sales + deliveryIncome - cogs - expenseTotal;

      return {
        order_count: selectedOrders.length,
        sales: Math.round(sales * 100) / 100,
        delivery_income: Math.round(deliveryIncome * 100) / 100,
        cash_received: Math.round(cashReceived * 100) / 100,
        cost_of_goods_sold: Math.round(cogs * 100) / 100,
        recorded_expenses: Math.round(expenseTotal * 100) / 100,
        estimated_profit_before_tax: Math.round(operatingResult * 100) / 100,
        cost_data_note: itemRowsCounted === 0
          ? "No order-item cost snapshots found in this period; profit may be overstated."
          : "Profit estimate uses saved order-item costs and recorded expenses.",
      };
    };

    const monthly = summarize(monthStart);
    const yearly = summarize(yearStart);
    const lifetime = summarize(null);
    const profile = profileResult.data?.[0] ?? null;

    // Reference only: this is not VAT payable and must not be added to checkout.
    const vatReferenceRate = 0.18;
    const vatReference = Math.round(lifetime.sales * vatReferenceRate * 100) / 100;

    // Do not invent an income-tax rate. Only show an estimate when an
    // administrator has verified a rule and marked an obligation applicable.
    const verifiedIncomeRule = (rulesResult.data ?? []).find((rule: any) =>
      rule.verified === true &&
      rule.calculation_method === "percentage" &&
      rule.rate !== null &&
      rule.rate !== undefined &&
      Number.isFinite(Number(rule.rate)) &&
      Number(rule.rate) >= 0 &&
      String(rule.tax_type ?? "").toLowerCase().includes("income") &&
      (obligationsResult.data ?? []).some((obligation: any) =>
        String(obligation.tax_rule_id) === String(rule.id) &&
        obligation.status === "applicable"
      )
    );
    // Percentage rates are always stored as human percentages: 30 means 30%.
    const incomeRate = verifiedIncomeRule
      ? Number(verifiedIncomeRule.rate) / 100
      : null;
    const incomeTaxEstimate = incomeRate === null
      ? null
      : Math.round(Math.max(lifetime.estimated_profit_before_tax, 0) * incomeRate * 100) / 100;

    return NextResponse.json({
      success: true,
      salesSummary: {
        generated_at: now.toISOString(),
        currency: "TZS",
        monthly,
        yearly,
        lifetime,
        vat_registered: profile?.vat_registered === true,
        vat_reference_rate: vatReferenceRate,
        vat_reference_amount: vatReference,
        vat_reference_is_payable: false,
        verified_income_tax_rate: incomeRate,
        estimated_income_tax: incomeTaxEstimate,
        income_tax_rule_verified: incomeRate !== null,
      },
      profile: profile,
      rules: rulesResult.data ?? [],
      obligations: obligationsResult.data ?? [],
      purchases: purchasesResult.data ?? [],
      returns: returnsResult.data ?? [],
      payments: paymentsResult.data ?? [],
      deadlines: deadlinesResult.data ?? [],
      adjustments: adjustmentsResult.data ?? [],
    });
  } catch (error) {
    console.error("Tax management GET failed:", error);
    return fail("Unable to load tax management data.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getAuthorizedAdmin();

    if (!admin) {
      return fail("Only the authorized Gamora administrator can change tax records.", 403);
    }

    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return fail("A valid JSON body is required.");
    }

    const db = databaseClient();
    const action = typeof body.action === "string" ? body.action : "";

    if (action === "save_profile") {
      const businessName =
        typeof body.business_name === "string" ? body.business_name.trim() : "";

      const registrationStatus = body.registration_status;
      const allowedStatuses = ["pre_registration", "registered", "suspended"];

      if (!businessName || businessName.length > 200) {
        return fail("Enter a business name of no more than 200 characters.");
      }

      if (
        typeof registrationStatus !== "string" ||
        !allowedStatuses.includes(registrationStatus)
      ) {
        return fail("Select a valid business registration status.");
      }

      const optionalText = (value: unknown, max = 200) =>
        typeof value === "string" && value.trim()
          ? value.trim().slice(0, max)
          : null;

      const profile = {
        id: 1,
        business_name: businessName,
        registration_status: registrationStatus,
        registration_number: optionalText(body.registration_number),
        tin: optionalText(body.tin, 100),
        vat_registered: body.vat_registered === true,
        vat_number: optionalText(body.vat_number, 100),
        business_address: optionalText(body.business_address, 500),
        country_code: "TZ",
        currency_code: "TZS",
        notes: optionalText(body.notes, 2000),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await db
        .from("tax_business_profiles")
        .upsert(profile, { onConflict: "id" })
        .select("*")
        .single();

      if (error) {
        console.error("Tax profile save failed:", error);
        return fail("Unable to save the business tax profile.", 500);
      }

      return NextResponse.json({ success: true, profile: data });
    }

    if (action === "create_purchase") {
      const supplierName =
        typeof body.supplier_name === "string" ? body.supplier_name.trim() : "";

      const rawItems = Array.isArray(body.items) ? body.items : [];
      const purchaseDate =
        typeof body.purchase_date === "string" ? body.purchase_date : "";

      if (!supplierName || supplierName.length > 200) {
        return fail("Supplier name is required and must not exceed 200 characters.");
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(purchaseDate)) {
        return fail("Enter a valid purchase date in YYYY-MM-DD format.");
      }

      if (rawItems.length < 1 || rawItems.length > 500) {
        return fail("Add between 1 and 500 purchase items.");
      }

      const otherCosts = Number(body.other_costs ?? 0);
      const headerDiscount = Number(body.discount_amount ?? 0);

      if (
        !Number.isFinite(otherCosts) ||
        otherCosts < 0 ||
        !Number.isFinite(headerDiscount) ||
        headerDiscount < 0
      ) {
        return fail("Other costs and discounts must be valid non-negative amounts.");
      }

      const items: Array<{
        product_id: number | null;
        product_name: string;
        quantity: number;
        unit_cost: number;
        discount_amount: number;
        line_total: number;
      }> = [];

      for (const raw of rawItems) {
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
          return fail("One or more purchase items are invalid.");
        }

        const item = raw as Record<string, unknown>;
        const productName =
          typeof item.product_name === "string" ? item.product_name.trim() : "";
        const quantity = Number(item.quantity);
        const unitCost = Number(item.unit_cost);
        const discount = Number(item.discount_amount ?? 0);
        const productId =
          item.product_id === null ||
          item.product_id === undefined ||
          item.product_id === ""
            ? null
            : Number(item.product_id);

        if (
          !productName ||
          productName.length > 300 ||
          !Number.isFinite(quantity) ||
          quantity <= 0 ||
          !Number.isFinite(unitCost) ||
          unitCost < 0 ||
          !Number.isFinite(discount) ||
          discount < 0 ||
          discount > quantity * unitCost ||
          (productId !== null &&
            (!Number.isSafeInteger(productId) || productId <= 0))
        ) {
          return fail("Check each item name, quantity, cost, discount and product ID.");
        }

        const gross = quantity * unitCost;
        items.push({
          product_id: productId,
          product_name: productName,
          quantity,
          unit_cost: unitCost,
          discount_amount: discount,
          line_total: Math.round((gross - discount) * 100) / 100,
        });
      }

      const subtotal = Math.round(
        items.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0) * 100
      ) / 100;

      const itemDiscounts = items.reduce(
        (sum, item) => sum + item.discount_amount,
        0
      );

      const totalDiscount = Math.round((itemDiscounts + headerDiscount) * 100) / 100;
      const total = Math.round((subtotal + otherCosts - totalDiscount) * 100) / 100;

      if (total < 0) {
        return fail("Total purchase cost cannot be negative.");
      }

      const suppliedReference =
        typeof body.purchase_reference === "string"
          ? body.purchase_reference.trim()
          : "";

      const purchaseReference =
        suppliedReference || `GAM-PUR-${Date.now()}`;

      if (purchaseReference.length > 100) {
        return fail("Purchase reference must not exceed 100 characters.");
      }

      const optionalText = (value: unknown, max = 200) =>
        typeof value === "string" && value.trim()
          ? value.trim().slice(0, max)
          : null;

      const orderNumber = optionalText(body.order_number, 100);

      if (orderNumber) {
        const { data: order, error: orderError } = await db
          .from("orders")
          .select("order_number")
          .eq("order_number", orderNumber)
          .maybeSingle();

        if (orderError) {
          console.error("Purchase order validation failed:", orderError);
          return fail("Unable to validate the linked order.", 500);
        }

        if (!order) {
          return fail("The selected order number does not exist.");
        }
      }

      const paymentStatus = body.payment_status;
      const purchaseStatus = body.purchase_status;

      if (!["unpaid", "partially_paid", "paid"].includes(String(paymentStatus))) {
        return fail("Select a valid supplier payment status.");
      }

      if (!["recorded", "received", "cancelled"].includes(String(purchaseStatus))) {
        return fail("Select a valid purchase status.");
      }

      const { data: purchase, error: purchaseError } = await db
        .from("supplier_purchases")
        .insert({
          purchase_reference: purchaseReference,
          supplier_name: supplierName,
          supplier_contact: optionalText(body.supplier_contact, 200),
          supplier_tin: optionalText(body.supplier_tin, 100),
          order_number: orderNumber,
          purchase_date: purchaseDate,
          currency_code: "TZS",
          subtotal,
          other_costs: otherCosts,
          discount_amount: totalDiscount,
          total_amount: total,
          payment_status: paymentStatus,
          purchase_status: purchaseStatus,
          receipt_url: optionalText(body.receipt_url, 1000),
          notes: optionalText(body.notes, 2000),
          created_by: admin.email ?? ADMIN_EMAIL,
        })
        .select("*")
        .single();

      if (purchaseError || !purchase) {
        console.error("Supplier purchase save failed:", purchaseError);
        return fail("Unable to save the supplier purchase. Check its reference and details.", 500);
      }

      const { data: savedItems, error: itemsError } = await db
        .from("supplier_purchase_items")
        .insert(
          items.map((item) => ({
            ...item,
            purchase_id: purchase.id,
          }))
        )
        .select("*");

      if (itemsError) {
        console.error("Supplier purchase items save failed:", itemsError);

        const { error: rollbackError } = await db
          .from("supplier_purchases")
          .delete()
          .eq("id", purchase.id);

        if (rollbackError) {
          console.error("Supplier purchase rollback failed:", rollbackError);
        }

        return fail("Purchase items could not be saved; the purchase was rolled back where possible.", 500);
      }

      return NextResponse.json(
        { success: true, purchase: { ...purchase, supplier_purchase_items: savedItems ?? [] } },
        { status: 201 }
      );
    }


    if (action === "save_tax_rule") {
      const ruleName = typeof body.rule_name === "string" ? body.rule_name.trim() : "";
      const taxType = typeof body.tax_type === "string" ? body.tax_type.trim() : "";
      const method = typeof body.calculation_method === "string"
        ? body.calculation_method
        : "manual";
      const rawRate = body.rate;
      const rate = rawRate === "" || rawRate === null || rawRate === undefined
        ? null
        : Number(rawRate);
      const verified = body.verified === true;
      const confirmed = body.verification_confirmed === true;
      const sourceName = typeof body.source_name === "string"
        ? body.source_name.trim()
        : "";
      const sourceUrl = typeof body.source_url === "string"
        ? body.source_url.trim()
        : "";
      const effectiveFrom = typeof body.effective_from === "string" && body.effective_from
        ? body.effective_from
        : null;
      const effectiveTo = typeof body.effective_to === "string" && body.effective_to
        ? body.effective_to
        : null;

      if (!ruleName || ruleName.length > 200 || !taxType || taxType.length > 100) {
        return fail("Enter a rule name and a tax type within the allowed length.");
      }
      if (!["manual", "percentage", "fixed_amount"].includes(method)) {
        return fail("Select a valid calculation method.");
      }
      if (rate !== null && (!Number.isFinite(rate) || rate < 0 || rate > 1000000000)) {
        return fail("Enter a valid non-negative tax rate or amount.");
      }
      if (method === "percentage" && rate === null) {
        return fail("A percentage rule must have a rate.");
      }
      if (verified && (!confirmed || !sourceName)) {
        return fail("To verify this rule, confirm that you checked it with TRA or a qualified tax adviser and enter the source.");
      }
      if (
        (effectiveFrom && !/^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom)) ||
        (effectiveTo && !/^\d{4}-\d{2}-\d{2}$/.test(effectiveTo)) ||
        (effectiveFrom && effectiveTo && effectiveTo < effectiveFrom)
      ) {
        return fail("Check the effective dates for this rule.");
      }
      if (sourceUrl && sourceUrl.length > 1000) {
        return fail("The source URL is too long.");
      }
      if (sourceUrl && !/^https?:\/\/\S+$/i.test(sourceUrl)) {
        return fail("Enter a valid HTTP or HTTPS source URL.");
      }

      const optionalText = (value: unknown, max = 2000) =>
        typeof value === "string" && value.trim()
          ? value.trim().slice(0, max)
          : null;

      const { data, error } = await db
        .from("tax_rules")
        .insert({
          rule_name: ruleName,
          tax_type: taxType,
          rate,
          calculation_method: method,
          source_name: optionalText(sourceName, 300),
          source_url: optionalText(sourceUrl, 1000),
          verified,
          effective_from: effectiveFrom,
          effective_to: effectiveTo,
          notes: optionalText(body.notes, 2000),
          updated_at: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (error || !data) {
        console.error("Tax rule save failed:", error);
        return fail("Unable to save the tax rule. Check the database permissions and fields.", 500);
      }

      return NextResponse.json({ success: true, rule: data }, { status: 201 });
    }

    if (action === "save_obligation") {
      const obligationName = typeof body.obligation_name === "string"
        ? body.obligation_name.trim()
        : "";
      const taxType = typeof body.tax_type === "string" ? body.tax_type.trim() : "";
      const status = typeof body.status === "string" ? body.status : "unverified";
      const allowedStatuses = ["unverified", "applicable", "not_applicable", "under_review"];
      const confirmed = body.verification_confirmed === true;
      const rawRuleId = body.tax_rule_id;
      const ruleId = rawRuleId === "" || rawRuleId === null || rawRuleId === undefined
        ? null
        : Number(rawRuleId);
      const effectiveFrom = typeof body.effective_from === "string" && body.effective_from
        ? body.effective_from
        : null;
      const effectiveTo = typeof body.effective_to === "string" && body.effective_to
        ? body.effective_to
        : null;

      if (!obligationName || obligationName.length > 200 || !taxType || taxType.length > 100) {
        return fail("Enter an obligation name and tax type within the allowed length.");
      }
      if (!allowedStatuses.includes(status)) {
        return fail("Select a valid obligation status.");
      }
      if (
        (status === "applicable" || status === "not_applicable") &&
        !confirmed
      ) {
        return fail("Confirm that you verified applicability with TRA or a qualified tax adviser.");
      }
      if (
        ruleId !== null &&
        (!Number.isSafeInteger(ruleId) || ruleId <= 0)
      ) {
        return fail("Select a valid tax rule or leave the rule blank.");
      }
      if (
        (effectiveFrom && !/^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom)) ||
        (effectiveTo && !/^\d{4}-\d{2}-\d{2}$/.test(effectiveTo)) ||
        (effectiveFrom && effectiveTo && effectiveTo < effectiveFrom)
      ) {
        return fail("Check the effective dates for this obligation.");
      }

      if (ruleId !== null) {
        const { data: linkedRule, error: linkedRuleError } = await db
          .from("tax_rules")
          .select("id")
          .eq("id", ruleId)
          .maybeSingle();

        if (linkedRuleError) {
          console.error("Tax obligation rule validation failed:", linkedRuleError);
          return fail("Unable to validate the selected tax rule.", 500);
        }
        if (!linkedRule) {
          return fail("The selected tax rule does not exist.");
        }
      }

      const optionalText = (value: unknown, max = 2000) =>
        typeof value === "string" && value.trim()
          ? value.trim().slice(0, max)
          : null;

      const verifiedStatus = status === "applicable" || status === "not_applicable";
      const { data, error } = await db
        .from("tax_obligations")
        .insert({
          tax_rule_id: ruleId,
          obligation_name: obligationName,
          tax_type: taxType,
          status,
          period_type: optionalText(body.period_type, 100),
          effective_from: effectiveFrom,
          effective_to: effectiveTo,
          notes: optionalText(body.notes, 2000),
          verified_by: verifiedStatus ? (admin.email ?? ADMIN_EMAIL) : null,
          verified_at: verifiedStatus ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (error || !data) {
        console.error("Tax obligation save failed:", error);
        return fail("Unable to save the tax obligation. Check the database permissions and fields.", 500);
      }

      return NextResponse.json({ success: true, obligation: data }, { status: 201 });
    }

    return fail("Unsupported tax management action.");
  } catch (error) {
    console.error("Tax management POST failed:", error);
    return fail("Unable to save the tax management record.", 500);
  }
}
