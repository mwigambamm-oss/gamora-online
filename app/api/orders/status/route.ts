import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const ALLOWED_STATUSES = [
  "Pending",
  "Confirmed",
  "Processing",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

const TERMINAL_STATUSES = [
  "Delivered",
  "Cancelled",
];

const ACTIVE_STATUSES = [
  "Pending",
  "Confirmed",
  "Processing",
  "Out for Delivery",
  "Delivered",
];

function canMoveStatus(oldStatus: string, newStatus: string) {
  return ALLOWED_STATUSES.includes(newStatus);
}

async function restoreStockOnce(
  items: unknown[]
) {
  for (const rawItem of items) {
    const item = rawItem as {
      id?: number;
      name?: string;
      quantity?: number;
    };

    const productId = Number(item.id);
    const quantity = Number(item.quantity || 0);

    if (!productId || quantity <= 0) {
      continue;
    }

    const { data: product, error: productError } =
      await supabase
        .from("products")
        .select("id,name,stock")
        .eq("id", productId)
        .maybeSingle();

    if (productError) {
      throw new Error(
        `Failed to load product ${item.name || productId}: ${productError.message}`
      );
    }

    if (!product) {
      throw new Error(
        `Product not found while restoring stock: ${
          item.name || productId
        }`
      );
    }

    const currentStock = Number(product.stock || 0);
    const newStock = currentStock + quantity;

    const { error: updateError } =
      await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", productId);

    if (updateError) {
      throw new Error(
        `Failed to restore stock for ${
          item.name || productId
        }: ${updateError.message}`
      );
    }

    console.log(
      `📦 Stock restored: ${item.name || productId} +${quantity} = ${newStock}`
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const orderNumber = String(
      body?.order_number || ""
    ).trim();

    const requestedStatus = String(
      body?.status || ""
    ).trim();

    if (!orderNumber) {
      return NextResponse.json(
        { error: "Order number is required." },
        { status: 400 }
      );
    }

    if (!ALLOWED_STATUSES.includes(requestedStatus)) {
      return NextResponse.json(
        {
          error: "Invalid order status.",
          allowedStatuses: ALLOWED_STATUSES,
        },
        { status: 400 }
      );
    }

    const { data: order, error: loadError } =
      await supabase
        .from("orders")
        .select(
          "order_number,status,items"
        )
        .eq("order_number", orderNumber)
        .maybeSingle();

    if (loadError) {
      console.error(
        "Order lookup error:",
        loadError
      );

      return NextResponse.json(
        { error: loadError.message },
        { status: 500 }
      );
    }

    if (!order) {
      return NextResponse.json(
        {
          error: `Order ${orderNumber} was not found.`,
        },
        { status: 404 }
      );
    }

    const oldStatus =
      order.status || "Pending";

    if (oldStatus === requestedStatus) {
      return NextResponse.json({
        success: true,
        unchanged: true,
        message: `Order ${orderNumber} is already ${requestedStatus}.`,
        order: {
          order_number: orderNumber,
          status: oldStatus,
        },
      });
    }

    if (
      TERMINAL_STATUSES.includes(oldStatus)
    ) {
      return NextResponse.json(
        {
          error:
            oldStatus === "Delivered"
              ? "Delivered orders cannot be changed."
              : "Cancelled orders cannot be reopened.",
          currentStatus: oldStatus,
        },
        { status: 409 }
      );
    }

    if (
      !canMoveStatus(
        oldStatus,
        requestedStatus
      )
    ) {
      return NextResponse.json(
        {
          error: `Invalid status transition: ${oldStatus} → ${requestedStatus}`,
          currentStatus: oldStatus,
          requestedStatus,
        },
        { status: 409 }
      );
    }

    /*
     * IMPORTANT:
     *
     * Stock is NOT deducted here when moving:
     * Pending → Confirmed → Processing → Out for Delivery → Delivered.
     *
     * Stock was already deducted when the order was created.
     *
     * The ONLY stock operation here is restoration when an
     * active order is cancelled.
     */
    if (
      requestedStatus === "Cancelled" &&
      oldStatus !== "Cancelled"
    ) {
      const items = Array.isArray(order.items)
        ? order.items
        : [];

      await restoreStockOnce(items);
    }

    const { data: updatedOrder, error: updateError } =
      await supabase
        .from("orders")
        .update({
          status: requestedStatus,
        })
        .eq("order_number", orderNumber)
        .eq("status", oldStatus)
        .select()
        .single();

    if (updateError) {
      console.error(
        "Order status update error:",
        updateError
      );

      return NextResponse.json(
        {
          error: updateError.message,
          code: updateError.code || null,
          details: updateError.details || null,
          hint: updateError.hint || null,
        },
        { status: 500 }
      );
    }

    console.log(
      `✅ Order ${orderNumber}: ${oldStatus} → ${requestedStatus}`
    );

    return NextResponse.json(
      {
        success: true,
        message: `Order ${orderNumber} updated to ${requestedStatus}`,
        previousStatus: oldStatus,
        order: updatedOrder,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Order status API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update order status",
      },
      { status: 500 }
    );
  }
}
