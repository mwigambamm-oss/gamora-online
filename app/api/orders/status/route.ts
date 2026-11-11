
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";

function getAdminDatabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Supabase server environment variables are missing.");
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function verifyTelegramSecret(suppliedSecret: string | null) {
  const savedSecret = process.env.TELEGRAM_STATUS_SYNC_SECRET;

  if (!savedSecret || !suppliedSecret) return false;

  const saved = Buffer.from(savedSecret);
  const supplied = Buffer.from(suppliedSecret);

  if (saved.length !== supplied.length) return false;

  return timingSafeEqual(saved, supplied);
}

async function isAuthorizedAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) return false;

  const cookieStore = await cookies();

  const authClient = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Cookie updates may not be available in this request context.
        }
      },
    },
  });

  const { data, error } = await authClient.auth.getUser();

  if (error || !data.user) return false;

  return (
    data.user.email?.toLowerCase() ===
    "officialgamoraonline@gmail.com"
  );
}

export async function PATCH(request: Request) {
  try {
    const isTelegram = verifyTelegramSecret(
      request.headers.get("x-telegram-sync-secret")
    );

    if (!isTelegram) {
      const authorized = await isAuthorizedAdmin();

      if (!authorized) {
        return NextResponse.json(
          { error: "Unauthorized. Admin access is required." },
          { status: 403 }
        );
      }
    }

    const body = await request.json();

    const orderNumber = String(
      body.order_number || body.id || ""
    ).trim();

    const status = String(body.status || "").trim();

    if (!orderNumber || !status) {
      return NextResponse.json(
        { error: "Missing order number or status." },
        { status: 400 }
      );
    }

    const db = getAdminDatabase();

    const { data, error } = await db
      .from("orders")
      .update({ status })
      .eq("order_number", orderNumber)
      .select()
      .single();

    if (error) {
      console.error("Status update error:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Record delivery expense once when an order is delivered.
    try {
      if (status.toLowerCase() === "delivered") {
        const deliveryFee = Number(data?.delivery_fee || 0);

        if (deliveryFee > 0) {
          const { data: existingExpense, error: expenseCheckError } =
            await db
              .from("expenses")
              .select("id")
              .eq("category", "Transport / Delivery")
              .eq("notes", `Order: ${orderNumber}`)
              .limit(1)
              .maybeSingle();

          if (expenseCheckError) {
            console.error(
              "Delivery expense check failed:",
              expenseCheckError
            );
          } else if (!existingExpense) {
            const { error: expenseError } = await db
              .from("expenses")
              .insert({
                title: `Delivery - ${orderNumber}`,
                amount: deliveryFee,
                category: "Transport / Delivery",
                expense_date: new Date().toISOString().slice(0, 10),
                notes: `Order: ${orderNumber}`,
              });

            if (expenseError) {
              console.error(
                "Automatic delivery expense creation failed:",
                expenseError
              );
            }
          }
        }
      }
    } catch (deliveryExpenseError) {
      console.error(
        "Automatic delivery expense processing failed:",
        deliveryExpenseError
      );
    }

    // Do not echo Telegram-originated updates back to Telegram.
    if (!isTelegram) {
      try {
        const { syncTelegramOrderStatus } = await import("@/lib/robot");
        await syncTelegramOrderStatus(orderNumber, status);
      } catch (telegramError) {
        console.error("Telegram status sync failed:", telegramError);
      }
    }

    return NextResponse.json({
      success: true,
      order: data,
    });
  } catch (error) {
    console.error("PATCH ORDER STATUS ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update order status.",
      },
      { status: 500 }
    );
  }
}
