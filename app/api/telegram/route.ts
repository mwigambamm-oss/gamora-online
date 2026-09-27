import { NextResponse } from "next/server";
import { searchCatalog } from "@/lib/telegram/catalog-search";
import { generateCustomerReply } from "@/lib/telegram/ai";

type TelegramUpdate = {
  message?: {
    chat?: {
      id?: number;
    };
    text?: string;
  };
};

export async function POST(request: Request) {
  try {
    const update = (await request.json()) as TelegramUpdate;

    const chatId = update.message?.chat?.id;
    const customerMessage = update.message?.text?.trim();

    if (!chatId || !customerMessage) {
      return NextResponse.json({ ok: true });
    }

    const products = await searchCatalog(customerMessage, 8);

    const reply = await generateCustomerReply(
      customerMessage,
      products
    );

    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      console.error("TELEGRAM_BOT_TOKEN is missing");
      return NextResponse.json(
        { ok: false, error: "Telegram bot token is not configured" },
        { status: 500 }
      );
    }

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: reply,
        }),
      }
    );

    if (!telegramResponse.ok) {
      const errorText = await telegramResponse.text();

      console.error(
        "Telegram sendMessage failed:",
        telegramResponse.status,
        errorText
      );

      return NextResponse.json(
        { ok: false, error: "Failed to send Telegram reply" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error("Telegram webhook error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Telegram webhook processing failed",
      },
      { status: 500 }
    );
  }
}
