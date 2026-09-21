import { NextResponse } from "next/server";
import {
  createProductVariant,
  getProductById,
  getProductVariants,
} from "@/lib/products";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
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

    const variants = await getProductVariants(productId);

    return NextResponse.json({
      success: true,
      variants,
    });
  } catch (error: any) {
    console.error("GET PRODUCT VARIANTS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to load product variants",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
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

    const body = await req.json();

    const sku =
      typeof body.sku === "string" ? body.sku.trim() : "";

    if (!sku) {
      return NextResponse.json(
        {
          success: false,
          error: "SKU is required",
        },
        { status: 400 }
      );
    }

    const color =
      typeof body.color === "string"
        ? body.color.trim()
        : "";

    const size =
      typeof body.size === "string"
        ? body.size.trim()
        : "";

    const model =
      typeof body.model === "string"
        ? body.model.trim()
        : "";

    const stock = Number(body.stock ?? 0);

    if (!Number.isFinite(stock) || stock < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Stock must be zero or greater",
        },
        { status: 400 }
      );
    }

    const price =
      body.price === null ||
      body.price === undefined ||
      body.price === ""
        ? undefined
        : Number(body.price);

    const oldPrice =
      body.old_price === null ||
      body.old_price === undefined ||
      body.old_price === ""
        ? undefined
        : Number(body.old_price);

    if (
      price !== undefined &&
      (!Number.isFinite(price) || price < 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Price must be zero or greater",
        },
        { status: 400 }
      );
    }

    if (
      oldPrice !== undefined &&
      (!Number.isFinite(oldPrice) || oldPrice < 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Old price must be zero or greater",
        },
        { status: 400 }
      );
    }

    const images = Array.isArray(body.images)
      ? body.images.filter(
          (image: unknown): image is string =>
            typeof image === "string" && image.trim().length > 0
        )
      : [];

    const variant = await createProductVariant({
      product_id: productId,
      color,
      size,
      model,
      sku,
      price,
      old_price: oldPrice,
      stock: Math.floor(stock),
      images,
      is_active: body.is_active !== false,
    });

    return NextResponse.json(
      {
        success: true,
        variant,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("CREATE PRODUCT VARIANT ERROR:", error);

    const message = error?.message || "";

    if (
      message.toLowerCase().includes("duplicate") ||
      message.toLowerCase().includes("unique")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "A variant with this SKU or combination already exists",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: message || "Failed to create product variant",
      },
      { status: 500 }
    );
  }
}


export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const variantId = Number(id);

    if (!Number.isInteger(variantId) || variantId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid variant ID",
        },
        { status: 400 }
      );
    }

    const body = await req.json();

    const { updateProductVariant } = await import("@/lib/products");

    const updates: Record<string, unknown> = {};

    if (body.color !== undefined) {
      updates.color =
        typeof body.color === "string" ? body.color.trim() : "";
    }

    if (body.size !== undefined) {
      updates.size =
        typeof body.size === "string" ? body.size.trim() : "";
    }

    if (body.model !== undefined) {
      updates.model =
        typeof body.model === "string" ? body.model.trim() : "";
    }

    if (body.sku !== undefined) {
      const sku =
        typeof body.sku === "string" ? body.sku.trim() : "";

      if (!sku) {
        return NextResponse.json(
          {
            success: false,
            error: "SKU is required",
          },
          { status: 400 }
        );
      }

      updates.sku = sku;
    }

    if (body.price !== undefined) {
      const price =
        body.price === "" || body.price === null
          ? null
          : Number(body.price);

      if (
        price !== null &&
        (!Number.isFinite(price) || price < 0)
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Price must be zero or greater",
          },
          { status: 400 }
        );
      }

      updates.price = price;
    }

    if (body.old_price !== undefined) {
      const oldPrice =
        body.old_price === "" || body.old_price === null
          ? null
          : Number(body.old_price);

      if (
        oldPrice !== null &&
        (!Number.isFinite(oldPrice) || oldPrice < 0)
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Old price must be zero or greater",
          },
          { status: 400 }
        );
      }

      updates.old_price = oldPrice;
    }

    if (body.stock !== undefined) {
      const stock = Number(body.stock);

      if (!Number.isFinite(stock) || stock < 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Stock must be zero or greater",
          },
          { status: 400 }
        );
      }

      updates.stock = Math.floor(stock);
    }

    if (body.images !== undefined) {
      updates.images = Array.isArray(body.images)
        ? body.images.filter(
            (image: unknown): image is string =>
              typeof image === "string" && image.trim().length > 0
          )
        : [];
    }

    if (body.is_active !== undefined) {
      updates.is_active = Boolean(body.is_active);
    }

    const variant = await updateProductVariant(
      variantId,
      updates
    );

    return NextResponse.json({
      success: true,
      variant,
    });
  } catch (error: any) {
    console.error("UPDATE PRODUCT VARIANT ERROR:", error);

    const message = error?.message || "";

    if (
      message.toLowerCase().includes("duplicate") ||
      message.toLowerCase().includes("unique")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "A variant with this SKU or combination already exists",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: message || "Failed to update product variant",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const variantId = Number(id);

    if (!Number.isInteger(variantId) || variantId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid variant ID",
        },
        { status: 400 }
      );
    }

    const { deleteProductVariant } = await import("@/lib/products");

    await deleteProductVariant(variantId);

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("DELETE PRODUCT VARIANT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to delete product variant",
      },
      { status: 500 }
    );
  }
}
