import { supabase } from "./supabase";

export type Product = {
  id: number;
  name: string;
  price: number;
  oldPrice: number;
  category: string;
  stock: number;
  cost_price?: number;
  description: string;
  image: string;
};

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load products:", error);
    return [];
  }

  return (data || []).map((product) => ({
    id: product.id,
    name: product.name,
    price: Number(product.price),
    oldPrice: Number(product.old_price),
    category: product.category,
    stock: Number(product.stock),
      cost_price: Number(product.cost_price || 0),
    description: product.description || "",
    image: product.image || "",
  }));
}

export async function saveProduct(product: Omit<Product, "id">) {
  const { data, error } = await supabase
    .from("products")
    .insert({
      name: product.name,
      price: product.price,
      old_price: product.oldPrice,
      category: product.category,
      stock: product.stock,
      cost_price: product.cost_price ?? 0,
      description: product.description,
      image: product.image,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to save product:", error);
    throw error;
  }

  return data;
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
}

export async function updateProduct(
  id: number,
  product: Omit<Product, "id">
) {
  const { error } = await supabase
    .from("products")
    .update({
      name: product.name,
      price: product.price,
      old_price: product.oldPrice,
      category: product.category,
      stock: product.stock,
      cost_price: product.cost_price ?? 0,
      description: product.description,
      image: product.image,
    })
    .eq("id", id);

  if (error) {
    console.error("Failed to update product:", error);
    throw error;
  }

  return true;
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
    console.error("Failed to load product by ID:", error);
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    price: Number(data.price),
    oldPrice: Number(data.old_price),
    category: data.category,
    stock: Number(data.stock),
    description: data.description || "",
    image: data.image || "",
  };
}
