import { NextResponse } from "next/server";
import { updateProduct } from "@/lib/products";
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

    const hasNameSw =
      typeof body.name_sw === "string" &&
      body.name_sw.trim().length > 0;

    const hasCategorySw =
      typeof body.category_sw === "string" &&
      body.category_sw.trim().length > 0;

    const hasDescriptionSw =
      typeof body.description_sw === "string" &&
      body.description_sw.trim().length > 0;

    const hasSpecificationsSw =
      body.specifications_sw &&
      typeof body.specifications_sw === "object" &&
      !Array.isArray(body.specifications_sw) &&
      Object.keys(body.specifications_sw).length > 0;

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

      hasSpecificationsSw
        ? Promise.resolve(body.specifications_sw)
        : translateSpecificationsToSwahili(specifications),
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
