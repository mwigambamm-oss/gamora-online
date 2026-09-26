export type AccountingOrder = {
  id?: number;
  order_number?: string | number;
  status?: string;
  subtotal?: number;
  delivery_fee?: number;
  total?: number;
  created_at?: string;
  items?: any[];
};

export type AccountingOrderItem = {
  order_id?: number;
  product_id?: number;
  product_name?: string;
  quantity?: number;
  price?: number;
  cost_price_at_sale?: number;
};

export type AccountingProduct = {
  id: number;
  name?: string;
  stock?: number;
  price?: number;
  cost_price?: number;
};

export type AccountingPayment = {
  id?: number;
  order_id?: number;
  order_number?: string | number;
  amount?: number;
  payment_status?: string;
  payment_method?: string;
  created_at?: string;
};

export type AccountingExpense = {
  amount?: number;
  category?: string;
  expense_date?: string;
};

export function calculateAccounting({
  orders = [],
  orderItems = [],
  products = [],
  payments = [],
  orderPayments = [],
  expenses = [],
}: {
  orders?: AccountingOrder[];
  orderItems?: AccountingOrderItem[];
  products?: AccountingProduct[];
  payments?: AccountingPayment[];
  orderPayments?: AccountingPayment[];
  expenses?: AccountingExpense[];
}) {
  const validOrders = orders.filter(
    (order) => order.status !== "Cancelled"
  );

  const productCostMap = new Map<number, number>();

  for (const product of products) {
    productCostMap.set(
      Number(product.id),
      Number(product.cost_price || 0)
    );
  }

  /*
   * Revenue
   *
   * Product revenue = subtotal
   * Delivery income = delivery fee
   * Total revenue = subtotal + delivery
   */
  const productRevenue = validOrders.reduce(
    (sum, order) => sum + Number(order.subtotal || 0),
    0
  );

  const deliveryIncome = validOrders.reduce(
    (sum, order) => sum + Number(order.delivery_fee || 0),
    0
  );

  const revenue = productRevenue + deliveryIncome;

  /*
   * COGS
   *
   * Priority:
   * 1. Historical cost_price_at_sale
   * 2. Current products.cost_price
   */
  const cogs = orderItems.reduce((sum, item) => {
    const historicalCost = Number(item.cost_price_at_sale || 0);

    const currentCost =
      Number(
        productCostMap.get(Number(item.product_id)) || 0
      );

    const cost =
      historicalCost > 0
        ? historicalCost
        : currentCost;

    return (
      sum +
      cost * Number(item.quantity || 0)
    );
  }, 0);

  const grossProfit = revenue - cogs;

  const totalExpenses = expenses.reduce(
    (sum, expense) =>
      sum + Number(expense.amount || 0),
    0
  );

  const netProfit = grossProfit - totalExpenses;

  /*
   * Payments / Collections
   */
  const paidPayments = payments.filter(
    (payment) =>
      String(payment.payment_status || "").toLowerCase() === "paid"
  );

  const allOrderPayments = (
    orderPayments.length > 0
      ? orderPayments
      : payments
  ).filter(
    (payment) =>
      String(payment.payment_status || "").toLowerCase() === "paid"
  );

  const paidAmount = paidPayments.reduce(
    (sum, payment) =>
      sum + Number(payment.amount || 0),
    0
  );

  /*
   * Accounts Receivable
   *
   * Order balance = order total - payments received
   */
  const paidByOrder = new Map<string, number>();

  for (const payment of allOrderPayments) {
    const orderNumber = String(payment.order_number || "").trim();

    if (!orderNumber) continue;

    paidByOrder.set(
      orderNumber,
      (paidByOrder.get(orderNumber) || 0) +
        Number(payment.amount || 0)
    );
  }

  const unpaidAmount = validOrders.reduce(
    (sum, order) => {
      const orderNumber = String(
        order.order_number || ""
      ).trim();

      const paid =
        paidByOrder.get(orderNumber) || 0;

      const balance =
        Number(order.total || 0) - paid;

      return sum + Math.max(balance, 0);
    },
    0
  );

  /*
   * Payment methods
   */
  const paymentMethods: Record<string, number> = {};

  for (const payment of paidPayments) {
    const method =
      String(payment.payment_method || "Other").trim() ||
      "Other";

    paymentMethods[method] =
      (paymentMethods[method] || 0) +
      Number(payment.amount || 0);
  }

  /*
   * Product performance
   */
  const productPerformance = new Map<
    number,
    {
      id: number;
      name: string;
      quantity: number;
      sales: number;
      cost: number;
      profit: number;
    }
  >();

  for (const item of orderItems) {
    const productId = Number(item.product_id || 0);

    if (!productId) continue;

    const qty = Number(item.quantity || 0);
    const sellingPrice = Number(item.price || 0);

    const historicalCost =
      Number(item.cost_price_at_sale || 0);

    const currentCost =
      Number(productCostMap.get(productId) || 0);

    const costPrice =
      historicalCost > 0
        ? historicalCost
        : currentCost;

    const existing =
      productPerformance.get(productId) || {
        id: productId,
        name: item.product_name || "Unknown Product",
        quantity: 0,
        sales: 0,
        cost: 0,
        profit: 0,
      };

    existing.quantity += qty;
    existing.sales += sellingPrice * qty;
    existing.cost += costPrice * qty;
    existing.profit +=
      (sellingPrice - costPrice) * qty;

    productPerformance.set(productId, existing);
  }

  /*
   * Stock valuation
   */
  const stockCostValue = products.reduce(
    (sum, product) =>
      sum +
      Number(product.stock || 0) *
        Number(product.cost_price || 0),
    0
  );

  const stockSellingValue = products.reduce(
    (sum, product) =>
      sum +
      Number(product.stock || 0) *
        Number(product.price || 0),
    0
  );

  const grossMargin =
    productRevenue > 0
      ? (grossProfit / productRevenue) * 100
      : 0;

  const netMargin =
    productRevenue > 0
      ? (netProfit / productRevenue) * 100
      : 0;

  const pendingOrders = validOrders.filter(
    (order) =>
      order.status === "Pending" ||
      order.status === "Processing"
  ).length;

  const pendingPayments = payments.filter(
    (payment) =>
      payment.payment_status === "Pending" ||
      payment.payment_status === "Processing"
  ).length;

  const lowStock = products.filter(
    (product) =>
      Number(product.stock || 0) > 0 &&
      Number(product.stock || 0) <= 5
  ).length;

  const outOfStock = products.filter(
    (product) =>
      Number(product.stock || 0) <= 0
  ).length;

  return {
    orders: validOrders.length,

    productRevenue,
    deliveryIncome,
    revenue,

    cogs,
    grossProfit,
    grossMargin,

    expenses: totalExpenses,
    netProfit,
    netMargin,

    paidAmount,
    unpaidAmount,

    paymentMethods,

    stockCostValue,
    stockSellingValue,

    pendingOrders,
    pendingPayments,

    lowStock,
    outOfStock,

    products: products.length,

    productPerformance:
      Array.from(productPerformance.values()).sort(
        (a, b) => b.profit - a.profit
      ),
  };
}
