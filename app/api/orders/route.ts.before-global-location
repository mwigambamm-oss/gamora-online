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

type OrderBody = {
  id?: string | number;
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
  };
  location?: {
    latitude?: number | null;
    longitude?: number | null;
  };
  distanceKm?: number | null;
  deliveryFee?: number | null;
  deliveryMethod?: "pickup" | "delivery";
  items?: OrderItem[];
  subtotal?: number;
  discountTotal?: number;
  total?: number;
  status?: string;
  createdAt?: string;
};

async function changeStock(items: OrderItem[]) {
  const changed: { id: number; quantity: number }[] = [];

  for (const item of items) {
    const productId = Number(item.id);
    const quantity = Number(item.quantity);

    if (!productId || quantity <= 0) {
      throw new Error(`Invalid product or quantity for ${item.name}`);
    }

    const { data: product, error } = await supabase
      .from("products")
      .select("id,name,price,cost_price,stock")
      .eq("id", productId)
      .maybeSingle();

    if (error) throw error;

    if (!product) {
      throw new Error(`Product not found: ${item.name}`);
    }

    const stock = Number(product.stock || 0);

    if (stock < quantity) {
      throw new Error(
        `Not enough stock for ${product.name}. Available: ${stock}, requested: ${quantity}`
      );
    }

    const { error: updateError } = await supabase
      .from("products")
      .update({ stock: stock - quantity })
      .eq("id", productId);

    if (updateError) throw updateError;

    changed.push({
      id: productId,
      quantity,
    });
  }

  return changed;
}

async function rollbackStock(
  items: { id: number; quantity: number }[]
) {
  for (const item of items) {
    const { data: product } = await supabase
      .from("products")
      .select("stock")
      .eq("id", item.id)
      .maybeSingle();

    if (!product) continue;

    await supabase
      .from("products")
      .update({
        stock:
          Number(product.stock || 0) +
          Number(item.quantity),
      })
      .eq("id", item.id);
  }
}

export async function POST(request: Request) {
  let orderLockId = "";
  let changedStock: { id: number; quantity: number }[] = [];

  try {
    const body = (await request.json()) as OrderBody;

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

    const orderItems = Array.isArray(items) ? items : [];

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
      return NextResponse.json(
        {
          error: "This order is already being processed.",
        },
        { status: 409 }
      );
    }

    processingOrders.add(orderLockId);

    const { data: existingOrder, error: duplicateError } =
      await supabase
        .from("orders")
        .select("id,order_number")
        .eq("order_number", id)
        .maybeSingle();

    if (duplicateError) throw duplicateError;

    if (existingOrder) {
      return NextResponse.json(
        {
          error: "This order already exists.",
          order: existingOrder,
        },
        { status: 409 }
      );
    }

    const initialStatus = status || "Pending";
    const isPickup = deliveryMethod === "pickup";

    const safeSubtotal = Number(subtotal || 0);

    const safeDeliveryFee = isPickup
      ? 0
      : Number(deliveryFee || 0);

    const safeTotal = isPickup
      ? safeSubtotal
      : Number(
          total ??
            safeSubtotal +
              safeDeliveryFee
        );

    /*
     * REDUCE STOCK
     */
    if (initialStatus !== "Cancelled") {
      changedStock = await changeStock(orderItems);
    }

    /*
     * SAVE ORDER
     */
    const { data, error } = await supabase
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

        customer_address:
          customer?.address || "",

        delivery_method:
          isPickup
            ? "pickup"
            : "delivery",

        latitude:
          location?.latitude ?? null,

        longitude:
          location?.longitude ?? null,

        distance_km:
          isPickup
            ? null
            : distanceKm ?? null,

        delivery_fee:
          safeDeliveryFee,

        items: orderItems,

        subtotal:
          safeSubtotal,

        discount_total:
          Number(discountTotal || 0),

        total:
          safeTotal,

        status:
          initialStatus,

        created_at:
          createdAt ||
          new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      if (changedStock.length) {
        await rollbackStock(changedStock);
      }

      console.error(
        "FAILED TO SAVE ORDER:",
        error
      );

      return NextResponse.json(
        {
          error:
            error.message ||
            "Supabase insert failed",

          code:
            error.code || null,

          details:
            error.details || null,

          hint:
            error.hint || null,
        },
        { status: 500 }
      );
    }

    /*
     * SAVE ORDER ITEMS
     *
     * Existing order_items table requires:
     * order_id
     * product_name
     * price
     * quantity
     * total
     *
     * It also contains the business-control columns.
     */
    const productIds = orderItems.map((item) => Number(item.id));

    const { data: productCosts, error: productCostsError } =
  await supabase
    .from("products")
    .select("id,cost_price")
    .in("id", productIds);

    if (productCostsError) {
      console.error(
        "PRODUCT COSTS LOAD FAILED:",
        productCostsError
      );

      return NextResponse.json(
        {
          error: "Order saved, but product costs could not be loaded.",
          details: productCostsError.message,
          code: productCostsError.code || null,
          hint: productCostsError.hint || null,
        },
        { status: 500 }
      );
    }

    const costMap = new Map<number, number>();

for (const cost of productCosts || []) {
  costMap.set(
    Number(cost.id),
    Number(cost.cost_price || 0)
  );
}

    const orderItemsRows = orderItems.map((item) => {
      const quantity = Number(item.quantity || 1);
      const price = Number(item.price || 0);
      const productId = Number(item.id);

      const costPrice = costMap.get(productId) || 0;

      const subtotal = price * quantity;

      return {
        order_id: Number(data.id),
        order_number: data.order_number,

        product_id: productId,
        product_name: item.name,

        price,
        quantity,
        total: subtotal,

        selling_price_at_sale: price,
        cost_price_at_sale: costPrice,

        discount: 0,
        tax: 0,
        subtotal,

        created_at: new Date().toISOString(),
      };
    });

    const { error: orderItemsError } = await supabase
      .from("order_items")
      .insert(orderItemsRows);

    if (orderItemsError) {
      console.error(
        "ORDER ITEMS SAVE FAILED:",
        orderItemsError
      );

      return NextResponse.json(
        {
          error: "Order saved, but order items could not be saved.",
          details: orderItemsError.message,
          code: orderItemsError.code || null,
          hint: orderItemsError.hint || null,
        },
        { status: 500 }
      );
    }

    console.log(
      "ORDER ITEMS SAVED:",
      orderItemsRows
    );
    /*
     * TELEGRAM NOTIFICATION
     */
    try {
      const {
        orderRobotNotification,
      } = await import(
        "@/lib/robot"
      );

      await orderRobotNotification({
        order_number:
          data.order_number,

        customer_name:
          data.customer_name,

        customer_phone:
          data.customer_phone,

        items:
          orderItems.map((item) => ({
            ...item,
            image:
              item.image ||
              "",
          })),

        subtotal:
          Number(
            data.subtotal || 0
          ),

        delivery_fee:
          Number(
            data.delivery_fee || 0
          ),

        total:
          Number(
            data.total || 0
          ),

        status:
          data.status ||
          "Pending",
      });
    } catch (telegramError) {
      console.error(
        "Telegram notification failed:",
        telegramError
      );
    }

    return NextResponse.json(
      data,
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Create order error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create order",
      },
      { status: 500 }
    );
  } finally {
    if (orderLockId) {
      processingOrders.delete(
        orderLockId
      );
    }
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const id = String(
      body?.order_number ||
      body?.id ||
      ""
    ).trim();

    if (!id) {
      return NextResponse.json(
        { error: "Order ID is required." },
        { status: 400 }
      );
    }

    const isNumericId = /^\d+$/.test(id);

    let orderQuery = supabase
      .from("orders")
      .select("id,order_number,status,items");

    if (isNumericId) {
      orderQuery = orderQuery.or(
        `order_number.eq.${id},id.eq.${id}`
      );
    } else {
      orderQuery = orderQuery.eq(
        "order_number",
        id
      );
    }

    const { data: order, error: findError } =
      await orderQuery.maybeSingle();

    if (findError) {
      console.error(
        "Failed to find order:",
        findError
      );

      return NextResponse.json(
        {
          error:
            findError.message ||
            "Failed to find order.",
        },
        { status: 500 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    const stockStatuses = [
      "Pending",
      "Confirmed",
      "Processing",
      "Out for Delivery",
      "Delivered",
    ];

    const items = Array.isArray(order.items)
      ? order.items
      : [];

    if (stockStatuses.includes(order.status || "Pending")) {
      for (const item of items) {
        const productId = Number(item?.id);
        const quantity = Number(item?.quantity || 0);

        if (!productId || quantity <= 0) continue;

        const { data: product } =
          await supabase
            .from("products")
            .select("stock")
            .eq("id", productId)
            .maybeSingle();

        if (!product) continue;

        const { error: stockError } =
          await supabase
            .from("products")
            .update({
              stock:
                Number(product.stock || 0) +
                quantity,
            })
            .eq("id", productId);

        if (stockError) {
          console.error(
            "Failed to restore stock:",
            stockError
          );

          return NextResponse.json(
            {
              error:
                stockError.message ||
                "Failed to restore product stock.",
            },
            { status: 500 }
          );
        }
      }
    }

    const { error: deleteError } =
      await supabase
        .from("orders")
        .delete()
        .eq("id", order.id);

    if (deleteError) {
      console.error(
        "Failed to delete order:",
        deleteError
      );

      return NextResponse.json(
        {
          error:
            deleteError.message ||
            "Failed to delete order.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted: id,
    });

  } catch (error: any) {
    console.error(
      "DELETE ORDER ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Failed to delete order.",
      },
      { status: 500 }
    );
  }
}
