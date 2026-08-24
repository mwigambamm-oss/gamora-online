export async function orderRobotNotification(order: {
  order_number: string;
  customer_name?: string;
  customer_phone?: string;
  total?: number;
  status?: string;
}) {
  console.log("🤖 GAMORA ROBOT:", {
    order: order.order_number,
    customer: order.customer_name || "",
    phone: order.customer_phone || "",
    total: order.total || 0,
    status: order.status || "Pending",
    time: new Date().toISOString(),
  });
}
