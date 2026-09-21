import { NextResponse } from "next/server";
import { getProducts } from "@/lib/products";
import { analyzeProductImageColors } from "@/lib/ai/imageColorMapper";
import { updateProduct } from "@/lib/products";

export async function POST() {
  try {
    const products = await getProducts();

    const eligible = products.filter((product) => {
      const images =
        Array.isArray(product.images) && product.images.length > 0
          ? product.images
          : product.image
          ? [product.image]
          : [];

      const colors = Array.isArray(product.colors)
        ? product.colors.filter(Boolean)
        : [];

      return images.length > 0 && colors.length > 0;
    });

    const results = [];
    let success = 0;
    let failed = 0;

    for (const product of eligible) {
      try {
        const images =
          Array.isArray(product.images) && product.images.length > 0
            ? product.images
            : product.image
            ? [product.image]
            : [];

        const colors = Array.isArray(product.colors)
          ? product.colors.filter(Boolean)
          : [];

        const image_color_map = await analyzeProductImageColors(
          images,
          colors
        );

        await updateProduct(product.id, {
          image_color_map,
        });

        success++;

        results.push({
          id: product.id,
          name: product.name,
          success: true,
          image_color_map,
        });
      } catch (error) {
        failed++;

        results.push({
          id: product.id,
          name: product.name,
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Unknown error",
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    return NextResponse.json({
      success: true,
      totalProducts: products.length,
      eligibleProducts: eligible.length,
      analyzed: success,
      failed,
      results,
    });
  } catch (error) {
    console.error("Bulk image color analysis failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Bulk image color analysis failed",
      },
      { status: 500 }
    );
  }
}
