import { NextResponse } from "next/server";
import {
  getProductById,
  updateProduct,
} from "@/lib/products";
import { analyzeProductImageColors } from "@/lib/ai/imageColorMapper";

export async function POST(
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

    const product = await getProductById(productId);

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found",
        },
        { status: 404 }
      );
    }

    const images = Array.isArray(product.images)
      ? product.images
      : product.image
        ? [product.image]
        : [];

    const colors = Array.isArray(product.colors)
      ? product.colors
      : [];

    if (images.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Product has no images to analyze",
        },
        { status: 400 }
      );
    }

    if (colors.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Product has no colors to analyze",
        },
        { status: 400 }
      );
    }

    console.log(
      `AI IMAGE COLOR ANALYSIS START: product=${productId}, images=${images.length}, colors=${colors.join(", ")}`
    );

    const image_color_map = await analyzeProductImageColors(
      images,
      colors
    );

    await updateProduct(productId, {
      image_color_map,
    });

    console.log(
      "AI IMAGE COLOR ANALYSIS RESULT:",
      JSON.stringify(image_color_map)
    );

    return NextResponse.json({
      success: true,
      productId,
      image_color_map,
    });
  } catch (error: any) {
    console.error("AI IMAGE COLOR ANALYSIS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Failed to analyze product images",
      },
      { status: 500 }
    );
  }
}
