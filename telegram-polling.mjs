
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf8");

function getEnv(name) {
  const line = env
    .split("\n")
    .find((item) => item.trim().startsWith(`${name}=`));

  return line
    ? line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "")
    : "";
}

const token = getEnv("TELEGRAM_BOT_TOKEN");
const chatId = getEnv("TELEGRAM_CHAT_ID");
const syncSecret = getEnv("TELEGRAM_STATUS_SYNC_SECRET");

const APP = getEnv("APP_URL") || "https://gamoraonline.co.tz";
const API = `https://api.telegram.org/bot${token}`;

if (!token || !chatId || !syncSecret) {
  throw new Error(
    "Missing TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID or TELEGRAM_STATUS_SYNC_SECRET in .env.local"
  );
}

let offset = 0;

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

console.log("GAMORA Telegram order control started...");
console.log(`Connected to: ${APP}`);

async function telegramRequest(method, body) {
  const response = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(result.description || `Telegram ${method} failed`);
  }

  return result;
}

async function answerCallback(callbackId, text) {
  try {
    await telegramRequest("answerCallbackQuery", {
      callback_query_id: callbackId,
      text,
    });
  } catch (error) {
    console.error("Could not answer Telegram button:", error.message);
  }
}

function getKeyboard(orderNumber, status) {
  const button = (text, action) => ({
    text,
    callback_data: `${action}:${orderNumber}`,
  });

  if (status === "Pending") {
    return [[button("✅ CONFIRM", "confirm"), button("❌ CANCEL", "cancel")]];
  }

  if (status === "Confirmed") {
    return [
      [button("🚚 OUT FOR DELIVERY", "delivery")],
      [button("❌ CANCEL", "cancel"), button("↩️ PENDING", "pending")],
    ];
  }

  if (status === "Processing") {
    return [
      [button("🚚 OUT FOR DELIVERY", "delivery")],
      [button("↩️ PENDING", "pending")],
    ];
  }

  if (status === "Out for Delivery") {
    return [
      [button("📦 DELIVERED", "delivered")],
      [button("❌ CANCEL", "cancel"), button("↩️ PENDING", "pending")],
    ];
  }

  return [[button("↩️ PENDING", "pending")]];
}

async function editOrderMessage(callback, orderNumber, status) {
  const message = callback.message;

  if (!message?.chat?.id || !message?.message_id) return;

  const statusEmoji = {
    Pending: "⏳",
    Confirmed: "✅",
    Processing: "⚙️",
    "Out for Delivery": "🚚",
    Delivered: "📦",
    Cancelled: "❌",
  };

  const cleanedText = (message.text || "").replace(
    /\n\n📌 Status:.*$/s,
    ""
  );

  const newText =
    `${cleanedText}\n\n📌 Status: ${statusEmoji[status] || "📌"} ${status}`;

  await telegramRequest("editMessageText", {
    chat_id: message.chat.id,
    message_id: message.message_id,
    text: newText,
    reply_markup: {
      inline_keyboard: getKeyboard(orderNumber, status),
    },
  });
}

const statusMap = {
  confirm: "Confirmed",
  delivery: "Out for Delivery",
  delivered: "Delivered",
  cancel: "Cancelled",
  pending: "Pending",
};

while (true) {
  try {
    const response = await fetch(
      `${API}/getUpdates?timeout=25&offset=${offset}`
    );

    const result = await response.json();

    if (!result.ok) {
      console.error("Telegram API error:", result);
      await sleep(3000);
      continue;
    }

    for (const update of result.result) {
      offset = update.update_id + 1;

      if (!update.callback_query) continue;

      const callback = update.callback_query;
      const callbackChatId = String(callback.message?.chat?.id || "");

      if (callbackChatId !== String(chatId)) {
        await answerCallback(callback.id, "You are not authorized.");
        continue;
      }

      const action = callback.data || "";
      const separator = action.indexOf(":");

      if (separator === -1) {
        await answerCallback(callback.id, "Invalid order action.");
        continue;
      }

      const command = action.slice(0, separator);
      const orderNumber = action.slice(separator + 1);
      const newStatus = statusMap[command];

      if (!newStatus || !orderNumber) {
        await answerCallback(callback.id, "Invalid order action.");
        continue;
      }

      await answerCallback(callback.id, `Updating to ${newStatus}...`);

      try {
        const statusResponse = await fetch(
          `${APP}/api/orders/status`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "x-telegram-sync-secret": syncSecret,
            },
            body: JSON.stringify({
              order_number: orderNumber,
              status: newStatus,
            }),
          }
        );

        const statusResult = await statusResponse.json();

        if (!statusResponse.ok || !statusResult.success) {
          console.error("Order status update failed:", statusResult);
          continue;
        }

        console.log(`Order ${orderNumber} updated to ${newStatus}`);

        try {
          await editOrderMessage(callback, orderNumber, newStatus);
          console.log("Telegram order message updated.");
        } catch (editError) {
          console.error("Could not edit Telegram message:", editError.message);
        }
      } catch (error) {
        console.error("Order update failed:", error.message);
      }
    }
  } catch (error) {
    console.error("Telegram polling error:", error.message);
    await sleep(3000);
  }
}
