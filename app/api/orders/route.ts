import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const processingOrders = new Set<string>();

type OrderItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

async function changeStock(
  items: OrderItem[],
  direction: "decrease" | "increase"
) {
  const changed: {
    id: number;
    quantity: number;
  }[] = [];

  for (const item of items) {
    const productId = Number(item.id);
    const quantity = Number(item.quantity);

    if (!productId || quantity <= 0) {
      throw new Error(
        `Invalid product or quantity for ${item.name}`
      );
    }

    const { data: product, error: productError } =
      await supabase
        .from("products")
        .select("id,name,stock")
        .eq("id", productId)
        .maybeSingle();

    if (productError) {
      throw productError;
    }

    if (!product) {
      throw new Error(
        `Product not found: ${item.name}`
      );
    }

    const currentStock = Number(product.stock || 0);

    if (
      direction === "decrease" &&
      currentStock < quantity
    ) {
      throw new Error(
        `Not enough stock for ${product.name}. Available: ${currentStock}, requested: ${quantity}`
      );
    }

    const newStock =
      direction === "decrease"
        ? currentStock - quantity
        : currentStock + quantity;

    const { error: updateError } =
      await supabase
        .from("products")
        .update({
          stock: newStock,
        })
        .eq("id", productId);

    if (updateError) {
      throw updateError;
    }

    changed.push({
      id: productId,
      quantity,
    });
  }

  return changed;
}

async function rollbackStock(
  items: {
    id: number;
    quantity: number;
  }[],
  direction: "increase" | "decrease"
) {
  try {
    for (const item of items) {
      const { data: product } = await supabase
        .from("products")
        .select("stock")
        .eq("id", item.id)
        .maybeSingle();

      if (!product) continue;

      const currentStock = Number(product.stock || 0);

      const newStock =
        direction === "increase"
          ? currentStock + item.quantity
          : Math.max(
              0,
              currentStock - item.quantity
            );

      await supabase
        .from("products")
        .update({
          stock: newStock,
        })
        .eq("id", item.id);
    }
  } catch (error) {
    console.error(
      "Stock rollback failed:",
      error
    );
  }
}

export async function POST(request: Request) {
  let orderLockId = "";
  let changedStock: {
    id: number;
    quantity: number;
  }[] = [];

  try {
    const body = await request.json();

    const {
      id,
      customer,
      location,
      distanceKm,
      deliveryFee,
      deliveryMethod,
      items,
      subtotal,
      discountTotal,
      total,
      status,
      createdAt,
    } = body;

    const orderItems: OrderItem[] =
      Array.isArray(items) ? items : [];

    if (!orderItems.length) {
      return NextResponse.json(
        {
          error: "Order has no products.",
        },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        {
          error: "Order number is required.",
        },
        { status: 400 }
      );
    }

    orderLockId = String(id);

    if (processingOrders.has(orderLockId)) {
      console.warn(
        "⚠️ Duplicate order request blocked:",
        orderLockId
      );

      return NextResponse.json(
        {
          error: "This order is already being processed.",
        },
        { status: 409 }
      );
    }

    processingOrders.add(orderLockId);

    /*
     * Prevent duplicate orders
     */
    const { data: existingOrder } =
      await supabase
        .from("orders")
        .select("id,order_number")
        .eq("order_number", id)
        .maybeSingle();

    if (existingOrder) {
      return NextResponse.json(
        {
          error: "This order already exists.",
          order: existingOrder,
        },
        { status: 409 }
      );
    }

    /*
     * Only deduct stock when the initial order
     * is not cancelled.
     */
    const initialStatus =
      status || "Pending";

    if (initialStatus !== "Cancelled") {
      changedStock = await changeStock(
        orderItems,
        "decrease"
      );
    }

    const { data, error } =
      await supabase
        .from("orders")
        .insert({
          id: Date.now(),
          order_number: id,

          customer_name:
            customer?.name || "",

          customer_phone:
            customer?.phone || "",

          customer_email:
            customer?.email || "",
          customer_notes:
            customer?.notes || "",

          delivery_method:
            deliveryMethod === "pickup"
              ? "pickup"
              : "delivery",

          latitude:
            location?.latitude ?? null,

          longitude:
            location?.longitude ?? null,

          distance_km:
            deliveryMethod === "pickup"
              ? null
              : distanceKm ?? null,

          delivery_fee:
            deliveryMethod === "pickup"
              ? 0
              : deliveryFee ?? 0,

          items: orderItems,

          subtotal: subtotal ?? 0,

          discount_total: discountTotal ?? 0,

          total:
            deliveryMethod === "pickup"
              ? subtotal ?? 0
              : total ?? 0,

          status: initialStatus,

          created_at:
            createdAt ||
            new Date().toISOString(),
        })
        .select()
        .single();

    if (error) {
      if (changedStock.length) {
        await rollbackStock(
          changedStock,
          "increase"
        );
      }

      console.error("FAILED TO SAVE ORDER");
      console.error("CODE:", error.code);
      console.error("MESSAGE:", error.message);
      console.error("DETAILS:", error.details);
      console.error("HINT:", error.hint);

      return NextResponse.json(
        {
          error:
            error.message ||
            "Supabase insert failed",
          code: error.code || null,
          details:
            error.details || null,
          hint:
            error.hint || null,
        },
        { status: 500 }
      );
    }

    // 🤖 GAMORA ROBOT NOTIFICATION
try {
  console.log("🤖 Starting Telegram order notification...");

  const { orderRobotNotification } = await import("@/lib/robot");

  const telegramResult = await orderRobotNotification({
    order_number: data.order_number,
    customer_name: data.customer_name,
    customer_phone: data.customer_phone,
    items: orderItems,
    subtotal: Number(data.subtotal || 0),
    delivery_fee: Number(data.delivery_fee || 0),
    total: Number(data.total || 0),
    status: data.status || "Pending",
  });

  console.log(
    "✅ Telegram order notification completed:",
    telegramResult
  );
} catch (robotError) {
  console.error(
    "❌ Telegram order notification failed:",
    robotError
  );
}


    processingOrders.delete(orderLockId);

    return NextResponse.json(data, {
      status: 201,
    });
  } catch (error) {
    // Request failed; allow this order number to be retried.
    if (orderLockId) {
      processingOrders.delete(orderLockId);
    }

    console.error("Create order error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create order",
      },
      { status: 500 }
    );
  }
}
