import { NextResponse } from "next/server";
import {
  getProductById,
  updateProduct,
} from "@/lib/products";
import { analyzeProductImageColors } from "@/lib/ai/imageColorMapper";
import { normalizeProductDescription } from "@/lib/specifications";
import {
  translateToSwahili,
  translateSpecificationsToSwahili,
} from "@/lib/translation/translate";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = Number(id);

    if (!Number.isFinite(productId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid product ID",
        },
        { status: 400 }
      );
    }

    const body = await req.json();

    const existingProduct = await getProductById(productId);

    if (!existingProduct) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found",
        },
        { status: 404 }
      );
    }

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const category =
      typeof body.category === "string" ? body.category.trim() : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const normalizedDescription =
      normalizeProductDescription(description);

    const specifications =
      normalizedDescription.specifications;

    const imagesChanged = Array.isArray(body.images);
    const colorsChanged = Array.isArray(body.colors);

    let image_color_map = existingProduct.image_color_map || {};

    if (imagesChanged || colorsChanged) {
      const effectiveImages = imagesChanged
        ? body.images
        : existingProduct.images || [];

      const effectiveColors = colorsChanged
        ? body.colors
        : existingProduct.colors || [];

      image_color_map = await analyzeProductImageColors(
        effectiveImages,
        effectiveColors
      );
    }

    const hasNameSw =
      typeof body.name_sw === "string" &&
      body.name_sw.trim().length > 0;

    const hasCategorySw =
      typeof body.category_sw === "string" &&
      body.category_sw.trim().length > 0;

    const hasDescriptionSw =
      typeof body.description_sw === "string" &&
      body.description_sw.trim().length > 0;

    const [
      name_sw,
      category_sw,
      description_sw,
      specifications_sw,
    ] = await Promise.all([
      hasNameSw
        ? Promise.resolve(body.name_sw)
        : name
          ? translateToSwahili(name)
          : Promise.resolve(""),

      hasCategorySw
        ? Promise.resolve(body.category_sw)
        : category
          ? translateToSwahili(category)
          : Promise.resolve(""),

      hasDescriptionSw
        ? Promise.resolve(body.description_sw)
        : description
          ? translateToSwahili(description)
          : Promise.resolve(""),

      translateSpecificationsToSwahili(specifications),
    ]);

    const product = await updateProduct(productId, {
      ...body,
      name,
      name_sw,
      category,
      category_sw,
      description,
      description_sw,
      specifications,
      specifications_sw,
      ...(imagesChanged || colorsChanged
        ? { image_color_map }
        : {}),
    });

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error: any) {
    console.error("PRODUCT UPDATE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to update product",
      },
      { status: 500 }
    );
  }
}
