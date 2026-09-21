type OrderItem = {
  id?: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  selectedColor?: string;
  selectedSize?: string;
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
    throw new Error(
      "Telegram environment variables are missing"
    );
  }

  const items = Array.isArray(order.items)
    ? order.items
    : [];

  const itemLines = items.map(
    (item, index) => {
      const price =
        Number(item.price || 0);

      const quantity =
        Number(item.quantity || 0);

      const variantLines = [
        item.selectedColor
          ? `   🎨 Color: ${item.selectedColor}`
          : "",
        item.selectedSize
          ? `   📏 Size: ${item.selectedSize}`
          : "",
      ].filter(Boolean);

      return (
        `${index + 1}. ${item.name}\n` +
        (variantLines.length
          ? variantLines.join("\n") + "\n"
          : "") +
        `   ${quantity} x TZS ${price.toLocaleString()}`
      );
    }
  );

  const itemsText =
    itemLines.length > 0
      ? itemLines.join("\n")
      : "-";

  const message =
    "🛒 GAMORA ONLINE - NEW ORDER\n\n" +
    `📦 Order: ${order.order_number}\n` +
    `👤 Customer: ${order.customer_name || "-"}\n` +
    `📞 Phone: ${order.customer_phone || "-"}\n\n` +
    "🛍️ PRODUCTS\n" +
    itemsText +
    "\n\n" +
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

  const messageResponse =
    await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        signal: AbortSignal.timeout(60000),
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "✅ CONFIRM",
                  callback_data:
                    `confirm:${order.order_number}`,
                },
                {
                  text: "❌ CANCEL",
                  callback_data:
                    `cancel:${order.order_number}`,
                },
              ],
              [
                {
                  text: "🚚 OUT FOR DELIVERY",
                  callback_data:
                    `delivery:${order.order_number}`,
                },
              ],
              [
                {
                  text: "📦 DELIVERED",
                  callback_data:
                    `delivered:${order.order_number}`,
                },
              ],
            ],
          },
        }),
      }
    );

  const messageResult =
    await messageResponse.json();

  if (
    !messageResponse.ok ||
    !messageResult.ok
  ) {
    console.error(
      "Telegram message error:",
      messageResult
    );

    throw new Error(
      messageResult?.description ||
        "Telegram notification failed"
    );
  }

  for (const item of items) {
    let image =
      typeof item.image === "string"
        ? item.image.trim()
        : "";

    if (image.startsWith("/")) {
      image =
        `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}${image}`;
    }

    if (!image) {
      continue;
    }

    try {
      const captionLines = [
        `📦 ${item.name}`,
        item.selectedColor
          ? `🎨 Color: ${item.selectedColor}`
          : "",
        item.selectedSize
          ? `📏 Size: ${item.selectedSize}`
          : "",
        `🔢 Qty: ${Number(item.quantity || 0)}`,
        `💵 TZS ${(
          Number(item.price || 0) *
          Number(item.quantity || 0)
        ).toLocaleString()}`,
        `🛒 Order: ${order.order_number}`,
      ].filter(Boolean);

      const caption = captionLines.join("\n");

      console.log("SENDING TELEGRAM PHOTO:", image);

      const photoResponse =
        await fetch(
          `https://api.telegram.org/bot${token}/sendPhoto`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              chat_id: chatId,
              photo: image,
              caption,
            }),
            signal: AbortSignal.timeout(60000),
          }
        );

      const photoResult =
        await photoResponse.json();

      console.log(
        "TELEGRAM PHOTO RESULT:",
        photoResult
      );

      if (
        !photoResponse.ok ||
        !photoResult.ok
      ) {
        console.error(
          "Telegram image failed:",
          photoResult
        );
      }
    } catch (error) {
      console.error(
        `Telegram image error for ${item.name}:`,
        error
      );
    }
  }

  console.log(
    "✅ Telegram order notification sent:",
    order.order_number
  );

  return messageResult;
}
