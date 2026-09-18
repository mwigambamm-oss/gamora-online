import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const productId = Number(body.product_id);

    if (!productId || !Number.isFinite(productId)) {
      return NextResponse.json(
        { success: false, error: "Valid product_id is required" },
        { status: 400 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Supabase server environment variables are missing",
        },
        { status: 500 }
      );
    }

    const supabase = createClient(url, serviceKey);

    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (fetchError || !product) {
      return NextResponse.json(
        {
          success: false,
          error: fetchError?.message || "Product not found",
        },
        { status: 404 }
      );
    }

    /*
     * Product content is intentionally kept in English.
     * The application UI can still use the EN/SW language system,
     * but product names, descriptions, features and specifications
     * are not automatically translated.
     *
     * We copy the original English content into the *_sw fields
     * for compatibility with existing database structure.
     */

    const colors = Array.isArray(product.colors) ? product.colors : [];
    const sizes = Array.isArray(product.sizes) ? product.sizes : [];

    const { data: updatedProduct, error: updateError } = await supabase
      .from("products")
      .update({
        name_sw: product.name || "",
        category_sw: product.category || "",
        description_sw: product.description || "",
        colors_sw: colors,
        sizes_sw: sizes,
        specifications_sw:
          product.specifications &&
          typeof product.specifications === "object" &&
          !Array.isArray(product.specifications)
            ? product.specifications
            : {},
      })
      .eq("id", productId)
      .select("*")
      .single();

    if (updateError) {
      console.error("PRODUCT CONTENT UPDATE ERROR:", updateError);

      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      product: updatedProduct,
      message: "Product content is kept in English.",
    });
  } catch (error: any) {
    console.error("PRODUCT CONTENT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to update product content",
      },
      { status: 500 }
    );
  }
}
