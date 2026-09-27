import { supabase } from "@/lib/supabase";

export type TelegramProductResult = {
  id: number;
  name: string;
  name_sw: string;
  price: number;
  oldPrice?: number;
  category: string;
  category_sw: string;
  stock: number;
  image: string;
  images: string[];
  colors: string[];
  colors_sw: string[];
  sizes: string[];
  sizes_sw: string[];
  sizePrices: Record<string, number>;
  description: string;
  description_sw: string;
  specifications: Record<string, string>;
  specifications_sw: Record<string, string>;
};

export async function searchCatalog(
  query: string,
  limit = 8
): Promise<TelegramProductResult[]> {
  const cleanQuery = query.trim();

  if (!cleanQuery) return [];

  const searchTerms = cleanQuery
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 2)
    .slice(0, 8);

  if (searchTerms.length === 0) return [];

  const orConditions = searchTerms.flatMap((term) => [
    `name.ilike.%${term}%`,
    `name_sw.ilike.%${term}%`,
    `category.ilike.%${term}%`,
    `category_sw.ilike.%${term}%`,
  ]);

  const { data, error } = await supabase
    .from("products")
    .select(
      [
        "id",
        "name",
        "name_sw",
        "price",
        "old_price",
        "category",
        "category_sw",
        "stock",
        "image",
        "images",
        "colors",
        "colors_sw",
        "sizes",
        "sizes_sw",
        "size_prices",
        "description",
        "description_sw",
        "specifications",
        "specifications_sw",
      ].join(",")
    )
    .or(orConditions.join(","))
    .order("id", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Telegram catalog search failed:", error);
    return [];
  }

  return (data || []).map((p: any) => ({
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
    image: p.image || "",
    images: Array.isArray(p.images) ? p.images : [],
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
    description: p.description || "",
    description_sw: p.description_sw || "",
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
  }));
}
