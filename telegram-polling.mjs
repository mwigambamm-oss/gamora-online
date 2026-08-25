import fs from "fs";

const env = fs.readFileSync(".env.local", "utf8");

function getEnv(name) {
  const line = env
    .split("\n")
    .find((line) =>
      line.trim().startsWith(`${name}=`)
    );

  return line
    ? line
        .slice(line.indexOf("=") + 1)
        .trim()
        .replace(/^["']|["']$/g, "")
    : "";
}

const token = getEnv("TELEGRAM_BOT_TOKEN");
const chatId = getEnv("TELEGRAM_CHAT_ID");

if (!token || !chatId) {
  throw new Error(
    "Telegram environment variables are missing"
  );
}

const API =
  `https://api.telegram.org/bot${token}`;

const APP = "http://localhost:3000";

let offset = 0;

const sleep = (ms) =>
  new Promise((resolve) =>
    setTimeout(resolve, ms)
  );

console.log(
  "🤖 GAMORA Telegram order control started..."
);

async function telegramRequest(
  method,
  body,
  retries = 3
) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();

      const timer = setTimeout(
        () => controller.abort(),
        15000
      );

      const response = await fetch(
        `${API}/${method}`,
        {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      clearTimeout(timer);

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(
          result?.description ||
          `Telegram ${method} failed`
        );
      }

      return result;

    } catch (error) {
      console.error(
        `⚠️ Telegram ${method} attempt ${attempt}/${retries} failed:`,
        error.message
      );

      if (attempt === retries) {
        throw error;
      }

      await sleep(2000);
    }
  }
}

async function answerCallback(
  callbackId,
  text
) {
  try {
    await telegramRequest(
      "answerCallbackQuery",
      {
        callback_query_id: callbackId,
        text,
      }
    );
  } catch (error) {
    console.error(
      "⚠️ Could not answer Telegram button:",
      error.message
    );
  }
}

async function editOrderMessage(
  callback,
  orderNumber,
  status
) {
  const message =
    callback.message;

  if (!message?.chat?.id || !message?.message_id) {
    return;
  }

  const statusEmoji = {
    Pending: "⏳",
    Confirmed: "✅",
    Processing: "⚙️",
    "Out for Delivery": "🚚",
    Delivered: "📦",
    Cancelled: "❌",
  };

  const emoji =
    statusEmoji[status] || "📌";

  const oldText =
    message.text || "";

  const cleanedText =
    oldText.replace(
      /\n\n📌 Status:.*$/s,
      ""
    );

  const newText =
    `${cleanedText}\n\n📌 Status: ${emoji} ${status}`;

  await telegramRequest(
    "editMessageText",
    {
      chat_id: message.chat.id,
      message_id: message.message_id,
      text: newText,
    }
  );
}

const statusMap = {
  confirm: "Confirmed",
  delivery: "Out for Delivery",
  delivered: "Delivered",
  cancel: "Cancelled",
};

while (true) {
  try {
    const response =
      await fetch(
        `${API}/getUpdates?timeout=25&offset=${offset}`
      );

    const result =
      await response.json();

    if (!result.ok) {
      console.error(
        "Telegram API error:",
        result
      );

      await sleep(3000);
      continue;
    }

    for (const update of result.result) {
      offset =
        update.update_id + 1;

      if (!update.callback_query) {
        continue;
      }

      const callback =
        update.callback_query;

      const callbackChatId =
        String(
          callback.message?.chat?.id || ""
        );

      if (
        callbackChatId !==
        String(chatId)
      ) {
        console.log(
          "⛔ Unauthorized Telegram user:",
          callbackChatId
        );

        await answerCallback(
          callback.id,
          "⛔ You are not authorized."
        );

        continue;
      }

      const action =
        callback.data || "";

      console.log(
        "🔘 Button clicked:",
        action
      );

      const separator =
        action.indexOf(":");

      if (separator === -1) {
        await answerCallback(
          callback.id,
          "❌ Invalid order action"
        );
        continue;
      }

      const command =
        action.slice(0, separator);

      const orderNumber =
        action.slice(separator + 1);

      const newStatus =
        statusMap[command];

      if (
        !newStatus ||
        !orderNumber
      ) {
        await answerCallback(
          callback.id,
          "❌ Invalid order action"
        );
        continue;
      }

      try {
        const statusResponse =
          await fetch(
            `${APP}/api/orders/status`,
            {
              method: "PATCH",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                order_number:
                  orderNumber,
                status:
                  newStatus,
              }),
            }
          );

        const statusResult =
          await statusResponse.json();

        if (
          !statusResponse.ok ||
          !statusResult.success
        ) {
          console.error(
            "❌ Order status update failed:",
            statusResult
          );

          await answerCallback(
            callback.id,
            `❌ ${
              statusResult?.error ||
              "Failed to update order"
            }`
          );

          continue;
        }

        console.log(
          `✅ ${orderNumber} → ${newStatus}`
        );

        await answerCallback(
          callback.id,
          `✅ Order ${newStatus}`
        );

        try {
          await editOrderMessage(
            callback,
            orderNumber,
            newStatus
          );

          console.log(
            "✏️ Telegram order message updated."
          );
        } catch (editError) {
          console.error(
            "⚠️ Could not edit Telegram message:",
            editError.message
          );
        }
      } catch (error) {
        console.error(
          "❌ Local API error:",
          error
        );

        await answerCallback(
          callback.id,
          "❌ Could not update order"
        );
      }
    }
  } catch (error) {
    console.error(
      "❌ Telegram polling error:",
      error
    );

    await sleep(3000);
  }
}
