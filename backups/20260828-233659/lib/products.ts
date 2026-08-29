import { supabase } from "./supabase";

export type Product = {
  id: number;
  name: string;
  price: number;
  oldPrice?: number;
  category: string;
  stock: number;
  description?: string;
  image?: string;
  images?: string[];
  cost_price?: number;
  colors?: string[];
  sizes?: string[];
  discount?: number;
  orders_count?: number;
  rating?: number;
};

function mapProduct(p: any): Product {
  return {
    id: Number(p.id),
    name: p.name || "",
    price: Number(p.price || 0),
    oldPrice:
      p.old_price !== null && p.old_price !== undefined
        ? Number(p.old_price)
        : undefined,
    category: p.category || "",
    stock: Number(p.stock || 0),
    description: p.description || "",
    image: p.image || "",
    images: Array.isArray(p.images) ? p.images : [],
    cost_price: Number(p.cost_price || 0),
    colors: Array.isArray(p.colors) ? p.colors : [],
    sizes: Array.isArray(p.sizes) ? p.sizes : [],
    discount: Number(p.discount || 0),
    orders_count: Number(p.orders_count || 0),
    rating: Number(p.rating || 0),
  };
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    console.error("Failed to load products:", error);
    return [];
  }

  return (data || []).map(mapProduct);
}

export async function getProductById(
  id: number
): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load product:", error);
    return null;
  }

  if (!data) return null;

  return mapProduct(data);
}

export async function saveProduct(product: Omit<Product, "id">) {
  const dbProduct = {
    name: product.name,
    price: Number(product.price),
    old_price:
      product.oldPrice !== undefined
        ? Number(product.oldPrice)
        : Number(product.price),
    category: product.category,
    stock: Number(product.stock),
    cost_price: Number(product.cost_price || 0),
    description: product.description || "",
    image: product.image || "",
    images: product.images || [],
    colors: product.colors || [],
    sizes: product.sizes || [],
    discount: Number(product.discount || 0),
  };

  const { data, error } = await supabase
    .from("products")
    .insert(dbProduct)
    .select("*")
    .single();

  if (error) {
    console.error("Failed to save product:", error);
    throw error;
  }

  return mapProduct(data);
}

export async function updateProduct(
  id: number,
  product: Partial<Product>
) {
  const dbProduct: Record<string, any> = {};

  if (product.name !== undefined) {
    dbProduct.name = product.name;
  }

  if (product.price !== undefined) {
    dbProduct.price = Number(product.price);
  }

  if (product.oldPrice !== undefined) {
    dbProduct.old_price = Number(product.oldPrice);
  }

  if (product.category !== undefined) {
    dbProduct.category = product.category;
  }

  if (product.stock !== undefined) {
    dbProduct.stock = Number(product.stock);
  }

  if (product.cost_price !== undefined) {
    dbProduct.cost_price = Number(product.cost_price);
  }

  if (product.description !== undefined) {
    dbProduct.description = product.description;
  }

  if (product.image !== undefined) {
    dbProduct.image = product.image;
  }

  if (product.images !== undefined) {
    dbProduct.images = product.images;
  }

  if (product.colors !== undefined) {
    dbProduct.colors = product.colors;
  }

  if (product.sizes !== undefined) {
    dbProduct.sizes = product.sizes;
  }

  if (product.discount !== undefined) {
    dbProduct.discount = Number(product.discount);
  }

  const { data, error } = await supabase
    .from("products")
    .update(dbProduct)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("Failed to update product:", error);
    throw error;
  }

  return mapProduct(data);
}

export async function deleteProduct(id: number) {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete product:", error);
    throw error;
  }

  return true;
}
