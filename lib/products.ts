import { supabase } from "./supabase";

export function shuffleProducts<T>(items: T[]): T[] {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}


function normalizeProductColors(colors: unknown): string[] {
  if (Array.isArray(colors)) {
    return colors
      .flatMap((color) =>
        String(color)
          .split(/[\/,]+/)
          .map((item) => item.trim())
          .filter(Boolean)
      )
      .filter(
        (color, index, list) =>
          list.findIndex(
            (item) => item.toLowerCase() === color.toLowerCase()
          ) === index
      );
  }

  if (typeof colors === "string") {
    return colors
      .split(/[\/,]+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .filter(
        (color, index, list) =>
          list.findIndex(
            (item) => item.toLowerCase() === color.toLowerCase()
          ) === index
      );
  }

  return [];
}

export type ProductVariant = {
  id: number;
  product_id: number;
  color?: string;
  size?: string;
  model?: string;
  sku: string;
  price?: number;
  old_price?: number;
  stock: number;
  images: string[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

function mapProductVariant(v: any): ProductVariant {
  return {
    id: Number(v.id),
    product_id: Number(v.product_id),
    color: v.color || "",
    size: v.size || "",
    model: v.model || "",
    sku: v.sku || "",
    price:
      v.price !== null && v.price !== undefined
        ? Number(v.price)
        : undefined,
    old_price:
      v.old_price !== null && v.old_price !== undefined
        ? Number(v.old_price)
        : undefined,
    stock: Number(v.stock || 0),
    images: Array.isArray(v.images) ? v.images : [],
    is_active: v.is_active !== false,
    created_at: v.created_at || undefined,
    updated_at: v.updated_at || undefined,
  };
}

export async function getProductVariants(
  productId: number
): Promise<ProductVariant[]> {
  const { data, error } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", productId)
    .order("id", { ascending: true });

  if (error) {
    console.error("Failed to load product variants:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return [];
  }

  return (data || []).map(mapProductVariant);
}

export async function getProductVariantById(
  variantId: number
): Promise<ProductVariant | null> {
  const { data, error } = await supabase
    .from("product_variants")
    .select("*")
    .eq("id", variantId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load product variant:", error);
    return null;
  }

  return data ? mapProductVariant(data) : null;
}

export async function createProductVariant(
  variant: Omit<ProductVariant, "id" | "created_at" | "updated_at">
): Promise<ProductVariant> {
  const { data, error } = await supabase
    .from("product_variants")
    .insert({
      product_id: variant.product_id,
      color: variant.color || null,
      size: variant.size || null,
      model: variant.model || null,
      sku: variant.sku,
      price:
        variant.price !== undefined && variant.price !== null
          ? Number(variant.price)
          : null,
      old_price:
        variant.old_price !== undefined && variant.old_price !== null
          ? Number(variant.old_price)
          : null,
      stock: Number(variant.stock || 0),
      images: variant.images || [],
      is_active: variant.is_active !== false,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Failed to create product variant:", error);
    throw error;
  }

  return mapProductVariant(data);
}

export async function updateProductVariant(
  variantId: number,
  variant: Partial<ProductVariant>
): Promise<ProductVariant> {
  const dbVariant: Record<string, any> = {};

  if (variant.product_id !== undefined) {
    dbVariant.product_id = Number(variant.product_id);
  }

  if (variant.color !== undefined) {
    dbVariant.color = variant.color || null;
  }

  if (variant.size !== undefined) {
    dbVariant.size = variant.size || null;
  }

  if (variant.model !== undefined) {
    dbVariant.model = variant.model || null;
  }

  if (variant.sku !== undefined) {
    dbVariant.sku = variant.sku;
  }

  if (variant.price !== undefined) {
    dbVariant.price =
      variant.price === null ? null : Number(variant.price);
  }

  if (variant.old_price !== undefined) {
    dbVariant.old_price =
      variant.old_price === null ? null : Number(variant.old_price);
  }

  if (variant.stock !== undefined) {
    dbVariant.stock = Number(variant.stock);
  }

  if (variant.images !== undefined) {
    dbVariant.images = variant.images || [];
  }

  if (variant.is_active !== undefined) {
    dbVariant.is_active = Boolean(variant.is_active);
  }

  dbVariant.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("product_variants")
    .update(dbVariant)
    .eq("id", variantId)
    .select("*")
    .single();

  if (error) {
    console.error("Failed to update product variant:", error);
    throw error;
  }

  return mapProductVariant(data);
}

export async function deleteProductVariant(
  variantId: number
): Promise<void> {
  const { error } = await supabase
    .from("product_variants")
    .delete()
    .eq("id", variantId);

  if (error) {
    console.error("Failed to delete product variant:", error);
    throw error;
  }
}

export type Product = {
  id: number;
  name: string;
  name_sw?: string;
  price: number;
  oldPrice?: number;
  category: string;
  category_sw?: string;
  stock: number;
  description?: string;
  description_sw?: string;
  image?: string;
  images?: string[];
  cost_price?: number;
  colors?: string[];
  colors_sw?: string[];
  sizes?: string[];
  sizes_sw?: string[];
  sizePrices?: Record<string, number>;
  sizeQuantities?: Record<string, number>;
  storageOptions?: {
    storage: string;
    price: number;
    stock: number;
  }[];
  specifications?: Record<string, string>;
  specifications_sw?: Record<string, string>;
  discount?: number;
  orders_count?: number;
  likes?: number;
  rating?: number;
  image_color_map?: Record<
    string,
    {
      images: string[];
      confidence: number;
    }
  >;
};

function mapProduct(p: any): Product {
  return {
    id: Number(p.id),
    name: p.name || "",
    name_sw: p.name_sw || "",
    price: Number(p.price || 0),
    oldPrice:
      p.old_price !== null && p.old_price !== undefined
        ? Number(p.old_price)
        : undefined,
    category: p.category || "",
    category_sw: p.category_sw || "",
    stock: Number(p.stock || 0),
    description: p.description || "",
    description_sw: p.description_sw || "",
    image: p.image || "",
    images: Array.isArray(p.images) ? p.images : [],
    cost_price: Number(p.cost_price || 0),
    colors: Array.isArray(p.colors) ? p.colors : [],
    colors_sw: Array.isArray(p.colors_sw) ? p.colors_sw : [],
    sizes: Array.isArray(p.sizes) ? p.sizes : [],
    sizes_sw: Array.isArray(p.sizes_sw) ? p.sizes_sw : [],
    sizePrices:
      p.size_prices &&
      typeof p.size_prices === "object" &&
      !Array.isArray(p.size_prices)
        ? Object.fromEntries(
            Object.entries(p.size_prices).map(([size, price]) => [
              size,
              Number(price),
            ])
          )
        : {},
    storageOptions: Array.isArray(p.storage_options)
      ? p.storage_options
      : [],
    specifications:
      p.specifications &&
      typeof p.specifications === "object" &&
      !Array.isArray(p.specifications)
        ? p.specifications
        : {},
    specifications_sw:
      p.specifications_sw &&
      typeof p.specifications_sw === "object" &&
      !Array.isArray(p.specifications_sw)
        ? p.specifications_sw
        : {},
    discount: Number(p.discount || 0),
    orders_count: Number(p.orders_count || 0),
    likes: Number(p.likes || 200),
    rating: Number(p.rating || 0),
    image_color_map:
      p.image_color_map &&
      typeof p.image_color_map === "object" &&
      !Array.isArray(p.image_color_map)
        ? p.image_color_map
        : {},
  };
}

export async function getProducts(options?: {
  category?: string;
  limit?: number;
}): Promise<Product[]> {
  const customerFields = [
    "id",
    "name",
    "name_sw",
    "price",
    "old_price",
    "category",
    "category_sw",
    "stock",
    "description",
    "description_sw",
    "image",
    "images",
    "colors",
    "colors_sw",
    "sizes",
    "sizes_sw",
    "size_prices",
    "size_quantities",
    "storage_options",
    "specifications",
    "specifications_sw",
    "discount",
    "orders_count",
    "likes",
    "rating",
    "image_color_map",
  ].join(",");

  let query = supabase
    .from("products")
    .select(options ? customerFields : "*")
    .order("id", { ascending: false });

  if (options?.category) {
    query = query.eq("category", options.category);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

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
    name_sw: product.name_sw || "",
    price: Number(product.price),
    old_price:
      product.oldPrice !== undefined
        ? Number(product.oldPrice)
        : Number(product.price),
    category: product.category,
    category_sw: product.category_sw || "",
    stock: Number(product.stock),
    cost_price: Number(product.cost_price || 0),
    description: product.description || "",
    description_sw: product.description_sw || "",
    image: product.image || "",
    images: product.images || [],
    colors: normalizeProductColors(product.colors),
    sizes: product.sizes || [],
    size_prices: product.sizePrices || {},
    size_quantities: product.sizeQuantities || {},
    image_color_map: product.image_color_map || {},
    specifications: product.specifications || {},
    specifications_sw: product.specifications_sw || {},
    discount: Number(product.discount || 0),
    likes: Math.floor(Math.random() * 1301) + 200,
    orders_count: Math.floor(Math.random() * 1701) + 300,
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

  if (product.name_sw !== undefined) {
    dbProduct.name_sw = product.name_sw;
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

  if (product.category_sw !== undefined) {
    dbProduct.category_sw = product.category_sw;
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

  if (product.description_sw !== undefined) {
    dbProduct.description_sw = product.description_sw;
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

  if (product.sizePrices !== undefined) {
    dbProduct.size_prices = product.sizePrices || {};
  }

  if (product.image_color_map !== undefined) {
    dbProduct.image_color_map = product.image_color_map || {};
  }

  if (product.specifications !== undefined) {
    dbProduct.specifications = product.specifications || {};
  }

  if (product.specifications_sw !== undefined) {
    dbProduct.specifications_sw = product.specifications_sw || {};
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
