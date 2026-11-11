
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const processingOrders = new Set<string>();

type OrderItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  selectedColor?: string;
  selectedSize?: string;
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

async function isAuthorizedAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

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

async function changeStock(
  db: ReturnType<typeof getAdminDatabase>,
  items: OrderItem[],
  changed: { id: number; quantity: number }[]
) {
  for (const item of items) {
    const productId = Number(item.id);
    const quantity = Number(item.quantity);

    if (
      !Number.isInteger(productId) ||
      productId <= 0 ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      throw new Error(`Invalid product or quantity for ${item.name}`);
    }

    const { data: product, error } = await db
      .from("products")
      .select("id,name,price,cost_price,stock,approval_status")
      .eq("id", productId)
      .maybeSingle();

    if (error) throw error;

    if (!product) {
      throw new Error(`Product not found: ${item.name}`);
    }

    if (product.approval_status !== "approved") {
      throw new Error(`${product.name} is not approved for sale.`);
    }

    const stock = Number(product.stock || 0);

    if (stock < quantity) {
      throw new Error(
        `Not enough stock for ${product.name}. Available: ${stock}, requested: ${quantity}`
      );
    }

    const { data: updatedProduct, error: updateError } = await db
      .from("products")
      .update({ stock: stock - quantity })
      .eq("id", productId)
      .eq("stock", stock)
      .select("id")
      .maybeSingle();

    if (updateError) throw updateError;

    if (!updatedProduct) {
      throw new Error(
        `Stock changed while processing ${product.name}. Please try again.`
      );
    }

    changed.push({
      id: productId,
      quantity,
    });
  }
}

async function rollbackStock(
  db: ReturnType<typeof getAdminDatabase>,
  items: { id: number; quantity: number }[]
) {
  for (const item of [...items].reverse()) {
    const { data: product, error } = await db
      .from("products")
      .select("stock")
      .eq("id", item.id)
      .maybeSingle();

    if (error || !product) continue;

    await db
      .from("products")
      .update({
        stock: Number(product.stock || 0) + item.quantity,
      })
      .eq("id", item.id);
  }

  items.length = 0;
}

function isInsideDarEsSalaam(
  latitude: number,
  longitude: number
): boolean {
  return (
    latitude >= -7.05 &&
    latitude <= -6.55 &&
    longitude >= 38.95 &&
    longitude <= 39.45
  );
}

export async function POST(request: Request) {
  let orderLockId = "";
  const changedStock: { id: number; quantity: number }[] = [];

  let db: ReturnType<typeof getAdminDatabase> | null = null;

  try {
    db = getAdminDatabase();

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
        { error: "Order has no products." },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: "Order number is required." },
        { status: 400 }
      );
    }

    orderLockId = String(id).trim();

    if (!orderLockId || orderLockId.length > 100) {
      return NextResponse.json(
        { error: "Invalid order number." },
        { status: 400 }
      );
    }

    if (processingOrders.has(orderLockId)) {
      return NextResponse.json(
        { error: "This order is already being processed." },
        { status: 409 }
      );
    }

    processingOrders.add(orderLockId);

    const { data: existingOrder, error: duplicateError } = await db
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

    if (!Number.isFinite(safeSubtotal) || safeSubtotal < 0) {
      return NextResponse.json(
        { error: "Invalid order subtotal." },
        { status: 400 }
      );
    }

    const latitude =
      location?.latitude != null ? Number(location.latitude) : null;

    const longitude =
      location?.longitude != null ? Number(location.longitude) : null;

    if (
      !isPickup &&
      (
        latitude === null ||
        longitude === null ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      )
    ) {
      return NextResponse.json(
        { error: "Delivery location is required." },
        { status: 400 }
      );
    }

    const outsideDar =
      !isPickup &&
      latitude !== null &&
      longitude !== null &&
      !isInsideDarEsSalaam(latitude, longitude);

    const safeDeliveryFee =
      isPickup || outsideDar ? 0 : Number(deliveryFee || 0);

    const safeDistanceKm =
      isPickup || outsideDar ? 0 : Number(distanceKm || 0);

    if (
      !Number.isFinite(safeDeliveryFee) ||
      safeDeliveryFee < 0 ||
      !Number.isFinite(safeDistanceKm) ||
      safeDistanceKm < 0
    ) {
      return NextResponse.json(
        { error: "Invalid delivery information." },
        { status: 400 }
      );
    }

    const safeTotal = isPickup
      ? safeSubtotal
      : Number(total ?? safeSubtotal + safeDeliveryFee);

    if (!Number.isFinite(safeTotal) || safeTotal < 0) {
      return NextResponse.json(
        { error: "Invalid order total." },
        { status: 400 }
      );
    }

    // Reduce stock only after checking approved products and availability.
    if (initialStatus !== "Cancelled") {
      await changeStock(db, orderItems, changedStock);
    }

    // Save the order using the server-side database client.
    const { data, error } = await db
      .from("orders")
      .insert({
        id: Date.now(),
        order_number: id,
        customer_name: customer?.name || "",
        customer_phone: customer?.phone || "",
        customer_email: customer?.email || "",
        customer_notes: customer?.notes || "",
        customer_address: customer?.address || "",
        delivery_method: isPickup ? "pickup" : "delivery",
        latitude,
        longitude,
        distance_km: isPickup ? null : safeDistanceKm,
        delivery_fee: safeDeliveryFee,
        items: orderItems,
        subtotal: safeSubtotal,
        discount_total: Number(discountTotal || 0),
        total: safeTotal,
        status: initialStatus,
        created_at: createdAt || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      await rollbackStock(db, changedStock);
      throw error;
    }

    // Load product costs for the order item records.
    const productIds = [
      ...new Set(orderItems.map((item) => Number(item.id))),
    ];

    const { data: productCosts, error: productCostsError } = await db
      .from("products")
      .select("id,cost_price")
      .in("id", productIds);

    if (productCostsError) {
      await db.from("orders").delete().eq("id", data.id);
      await rollbackStock(db, changedStock);
      throw productCostsError;
    }

    const costMap = new Map<number, number>();

    for (const cost of productCosts || []) {
      costMap.set(Number(cost.id), Number(cost.cost_price || 0));
    }

    const orderItemsRows = orderItems.map((item) => {
      const quantity = Number(item.quantity || 1);
      const price = Number(item.price || 0);
      const productId = Number(item.id);
      const costPrice = costMap.get(productId) || 0;
      const itemSubtotal = price * quantity;

      return {
        order_id: Number(data.id),
        order_number: data.order_number,
        product_id: productId,
        product_name: item.name,
        price,
        quantity,
        total: itemSubtotal,
        selling_price_at_sale: price,
        cost_price_at_sale: costPrice,
        discount: 0,
        tax: 0,
        subtotal: itemSubtotal,
        created_at: new Date().toISOString(),
      };
    });

    const { error: orderItemsError } = await db
      .from("order_items")
      .insert(orderItemsRows);

    if (orderItemsError) {
      await db.from("orders").delete().eq("id", data.id);
      await rollbackStock(db, changedStock);
      throw orderItemsError;
    }

    console.log("ORDER ITEMS SAVED:", orderItemsRows);

    // Telegram notification
    try {
      const { orderRobotNotification } = await import("@/lib/robot");

      await orderRobotNotification({
        order_number: data.order_number,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        customer_address: data.customer_address,
        location: location || null,
        distance_km: Number(distanceKm || 0),
        delivery_method: deliveryMethod || "delivery",
        items: orderItems.map((item) => ({
          ...item,
          image: item.image || "",
        })),
        subtotal: Number(data.subtotal || 0),
        delivery_fee: Number(data.delivery_fee || 0),
        total: Number(data.total || 0),
        status: data.status || "Pending",
      });
    } catch (telegramError) {
      console.error("Telegram notification failed:", telegramError);
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (db && changedStock.length) {
      await rollbackStock(db, changedStock);
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
  } finally {
    if (orderLockId) {
      processingOrders.delete(orderLockId);
    }
  }
}

export async function DELETE(request: Request) {
  try {
    // Only the authenticated Admin may delete an order.
    const authorized = await isAuthorizedAdmin();

    if (!authorized) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access is required." },
        { status: 403 }
      );
    }

    const db = getAdminDatabase();

    const body = await request.json().catch(() => ({}));

    const id = String(
      body?.order_number || body?.id || ""
    ).trim();

    if (!id) {
      return NextResponse.json(
        { error: "Order ID is required." },
        { status: 400 }
      );
    }

    const isNumericId = /^\d+$/.test(id);

    let orderQuery = db
      .from("orders")
      .select("id,order_number,status,items");

    if (isNumericId) {
      orderQuery = orderQuery.or(
        `order_number.eq.${id},id.eq.${id}`
      );
    } else {
      orderQuery = orderQuery.eq("order_number", id);
    }

    const { data: order, error: findError } =
      await orderQuery.maybeSingle();

    if (findError) throw findError;

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

    const items = Array.isArray(order.items) ? order.items : [];

    if (stockStatuses.includes(order.status || "Pending")) {
      for (const item of items) {
        const productId = Number(item?.id);
        const quantity = Number(item?.quantity || 0);

        if (!productId || quantity <= 0) continue;

        const { data: product, error: productError } = await db
          .from("products")
          .select("stock")
          .eq("id", productId)
          .maybeSingle();

        if (productError) throw productError;
        if (!product) continue;

        const { error: stockError } = await db
          .from("products")
          .update({
            stock: Number(product.stock || 0) + quantity,
          })
          .eq("id", productId);

        if (stockError) throw stockError;
      }
    }

    const { error: deleteError } = await db
      .from("orders")
      .delete()
      .eq("id", order.id);

    if (deleteError) throw deleteError;

    return NextResponse.json({
      success: true,
      deleted: id,
    });
  } catch (error) {
    console.error("DELETE ORDER ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete order.",
      },
      { status: 500 }
    );
  }
}
