import { supabase } from "./supabase";

export type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

export type Customer = {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
};

export type DeliveryMethod = "delivery" | "pickup";

export type Order = {
  id: string;

  customer: Customer;

  deliveryMethod: DeliveryMethod;

  location: {
    latitude: number;
    longitude: number;
  } | null;

  distanceKm: number | null;

  deliveryFee: number;

  items: CartItem[];

  subtotal: number;

  total: number;

  status: string;

  createdAt: string;
};

export async function getOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Failed to load orders:",
      error
    );

    throw error;
  }

  return (data || []).map((order) => ({
    id: String(
      order.order_number || order.id
    ),

    customer: {
      name:
        order.customer_name || "",

      phone:
        order.customer_phone || "",

      email:
        order.customer_email || "",

      address:
        order.customer_address || "",

      notes:
        order.customer_notes || "",
    },

    deliveryMethod:
      order.delivery_method === "pickup"
        ? "pickup"
        : "delivery",

    location:
      order.latitude !== null &&
      order.longitude !== null
        ? {
            latitude: Number(
              order.latitude
            ),

            longitude: Number(
              order.longitude
            ),
          }
        : null,

    distanceKm:
      order.distance_km !== null
        ? Number(order.distance_km)
        : null,

    deliveryFee:
      Number(order.delivery_fee || 0),

    items:
      Array.isArray(order.items)
        ? order.items
        : [],

    subtotal:
      Number(order.subtotal || 0),

    total:
      Number(order.total || 0),

    status:
      order.status || "Pending",

    createdAt:
      order.created_at,
  }));
}

export async function updateOrderStatus(
  id: string,
  status: string
) {
  const response = await fetch("/api/orders/status", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      order_number: id,
      status,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result?.error ||
        "Failed to update order status"
    );
  }

  return result;
}

export async function deleteOrder(
  id: string
) {
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("status, items")
    .eq("order_number", id)
    .single();

  if (orderError) {
    console.error("Failed to load order before deletion:", orderError);
    throw orderError;
  }

  const stockDeductedStatuses = [
    "Pending",
    "Confirmed",
    "Processing",
    "Out for Delivery",
    "Delivered",
  ];

  const shouldRestoreStock = stockDeductedStatuses.includes(
    order.status || "Pending"
  );

  const items = Array.isArray(order.items) ? order.items : [];

  if (shouldRestoreStock) {
    for (const item of items) {
      const quantity = Number(item.quantity || 0);
      const productId = Number(item.id);

      if (!productId || quantity <= 0) continue;

      const { data: product, error: productError } = await supabase
        .from("products")
        .select("stock")
        .eq("id", productId)
        .single();

      if (productError) {
        console.error("Failed to load product before deletion:", productError);
        throw productError;
      }

      const { error: stockError } = await supabase
        .from("products")
        .update({
          stock: Number(product.stock || 0) + quantity,
        })
        .eq("id", productId);

      if (stockError) {
        console.error("Failed to restore stock before deletion:", stockError);
        throw stockError;
      }
    }
  }

  const { error } = await supabase
    .from("orders")
    .delete()
    .eq("order_number", id);

  if (error) {
    console.error(
      "Failed to delete order:",
      error
    );

    throw error;
  }
}
