type OrderItem = {
  id?: number;
  name: string;
  price: number;
  quantity: number;
};

type OrderNotification = {
  order_number: string;
  customer_name?: string;
  customer_phone?: string;
  items?: OrderItem[];
  subtotal?: number;
  delivery_fee?: number;
  total?: number;
  status?: string;
};

export async function orderRobotNotification(
  order: OrderNotification
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    throw new Error("Telegram environment variables are missing");
  }

  const itemsText = order.items?.length
    ? order.items
        .map(
          (item, index) =>
            `${index + 1}. ${item.name}\n` +
            `   ${item.quantity} × TZS ${Number(
              item.price || 0
            ).toLocaleString()}`
        )
        .join("\n")
    : "-";

  const message =
    `🛒 GAMORA ONLINE - NEW ORDER\n\n` +
    `📦 Order: ${order.order_number}\n` +
    `👤 Customer: ${order.customer_name || "-"}\n` +
    `📞 Phone: ${order.customer_phone || "-"}\n\n` +
    `🛍️ PRODUCTS\n${itemsText}\n\n` +
    `📊 Subtotal: TZS ${Number(
      order.subtotal || 0
    ).toLocaleString()}\n` +
    `🚚 Delivery: TZS ${Number(
      order.delivery_fee || 0
    ).toLocaleString()}\n` +
    `💰 TOTAL: TZS ${Number(
      order.total || 0
    ).toLocaleString()}\n\n` +
    `📌 Status: ${order.status || "Pending"}`;

  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "✅ CONFIRM",
                callback_data: `confirm:${order.order_number}`,
              },
              {
                text: "❌ CANCEL",
                callback_data: `cancel:${order.order_number}`,
              },
            ],
            [
              {
                text: "🚚 OUT FOR DELIVERY",
                callback_data: `delivery:${order.order_number}`,
              },
            ],
            [
              {
                text: "📦 DELIVERED",
                callback_data: `delivered:${order.order_number}`,
              },
            ],
          ],
        },
      }),
    }
  );

  const result = await response.json();

  if (!response.ok || !result.ok) {
    console.error("Telegram API error:", result);
    throw new Error(
      result?.description || "Telegram notification failed"
    );
  }

  console.log("✅ Telegram notification sent:", result);

  return result;
}
