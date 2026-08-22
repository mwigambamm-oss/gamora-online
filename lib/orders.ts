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

export type Order = {
  id: string;
  customer: Customer;
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
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load orders:", error);
    throw error;
  }

  return (data || []).map((order) => ({
    id: order.id,
    customer: order.customer || {
      name: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
    },
    location: order.location || null,
    distanceKm: Number(order.distance_km || 0),
    deliveryFee: Number(order.delivery_fee || 0),
    items: order.items || [],
    subtotal: Number(order.subtotal || 0),
    total: Number(order.total || 0),
    status: order.status || "Pending",
    createdAt: order.created_at,
  }));
}

export async function updateOrderStatus(
  id: string,
  status: string
) {
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("Failed to update order:", error);
    throw error;
  }
}

export async function deleteOrder(id: string) {
  const { error } = await supabase
    .from("orders")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete order:", error);
    throw error;
  }
}
