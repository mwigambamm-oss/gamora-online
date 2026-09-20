import { NextResponse } from "next/server";
import { saveProduct } from "@/lib/products";
import { normalizeProductDescription } from "@/lib/specifications";
import { analyzeProductImageColors } from "@/lib/ai/imageColorMapper";
import {
  translateToSwahili,
  translateSpecificationsToSwahili,
} from "@/lib/translation/translate";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = body.name || "";
    const category = body.category || "";
    const description = body.description || "";
    const normalizedDescription =
      normalizeProductDescription(description);

    const specifications =
      normalizedDescription.specifications;
    const colors = Array.isArray(body.colors) ? body.colors : [];
    const sizes = Array.isArray(body.sizes) ? body.sizes : [];
    const images = Array.isArray(body.images) ? body.images : [];

    const image_color_map = await analyzeProductImageColors(
      images,
      colors
    );

    const [name_sw, category_sw, description_sw, specifications_sw, colors_sw, sizes_sw] =
      await Promise.all([
        body.name_sw?.trim()
          ? Promise.resolve(body.name_sw)
          : translateToSwahili(name),

        body.category_sw?.trim()
          ? Promise.resolve(body.category_sw)
          : translateToSwahili(category),

        body.description_sw?.trim()
          ? Promise.resolve(body.description_sw)
          : translateToSwahili(description),

        translateSpecificationsToSwahili(specifications),

        body.colors_sw &&
        Array.isArray(body.colors_sw) &&
        body.colors_sw.length > 0
          ? Promise.resolve(body.colors_sw)
          : Promise.all(colors.map((color: string) => translateToSwahili(color))),

        body.sizes_sw &&
        Array.isArray(body.sizes_sw) &&
        body.sizes_sw.length > 0
          ? Promise.resolve(body.sizes_sw)
          : Promise.all(sizes.map((size: string) => translateToSwahili(size))),
      ]);

    const product = await saveProduct({
      name,
      name_sw,
      price: Number(body.price || 0),
      oldPrice: Number(body.oldPrice || body.price || 0),
      category,
      category_sw,
      stock: Number(body.stock || 0),
      description,
      description_sw,
      image: body.image || "",
      images,
      image_color_map,
      cost_price: Number(body.cost_price || 0),
      colors,
      colors_sw,
      sizes,
      sizes_sw,
      specifications,
      specifications_sw,
      discount: Number(body.discount || 0),
    });

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error: any) {
    console.error("PRODUCT CREATE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create product",
      },
      { status: 500 }
    );
  }
}
