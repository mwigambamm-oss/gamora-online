import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const processingOrders = new Set<string>();

type OrderItem = {
  id: number;
  variantId?: number | string | null;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  selectedColor?: string;
  selectedSize?: string;
};

type OrderBody = {
  id?: string | number;
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
  };
  location?: {
    latitude?: number | null;
    longitude?: number | null;
  };
  distanceKm?: number | null;
  deliveryFee?: number | null;
  deliveryMethod?: "pickup" | "delivery";
  items?: OrderItem[];
  subtotal?: number;
  discountTotal?: number;
  total?: number;
  status?: string;
  createdAt?: string;
};

type ChangedStock = {
  productId: number;
  variantId: number | null;
  quantity: number;
};

async function resolveVariantId(item: OrderItem): Promise<number | null> {
  const explicitVariantId = Number(item.variantId || 0);

  if (explicitVariantId > 0) {
    const { data, error } = await supabase
      .from("product_variants")
      .select("id,product_id,color,size,model,stock,is_active")
      .eq("id", explicitVariantId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      throw new Error(
        `Variant not found for ${item.name} (variant ${explicitVariantId})`
      );
    }

    if (Number(data.product_id) !== Number(item.id)) {
      throw new Error(
        `Variant ${explicitVariantId} does not belong to product ${item.id}`
      );
    }

    if (data.is_active === false) {
      throw new Error(`Selected variant is inactive for ${item.name}`);
    }

    return Number(data.id);
  }

  const color = String(item.selectedColor || "").trim();
  const size = String(item.selectedSize || "").trim();

  /*
   * If the cart has colour/size but no variantId, resolve the variant
   * server-side so old cart data remains compatible.
   */
  if (color || size) {
    let query = supabase
      .from("product_variants")
      .select("id,product_id,color,size,model,stock,is_active")
      .eq("product_id", Number(item.id))
      .eq("is_active", true);

    if (color) {
      query = query.ilike("color", color);
    }

    if (size) {
      query = query.ilike("size", size);
    }

    const { data, error } = await query.limit(10);

    if (error) throw error;

    const normalizedColor = color.toLowerCase();
    const normalizedSize = size.toLowerCase();

    const exact = (data || []).find((variant) => {
      const variantColor = String(variant.color || "")
        .trim()
        .toLowerCase();

      const variantSize = String(variant.size || "")
        .trim()
        .toLowerCase();

      return (
        (!normalizedColor || variantColor === normalizedColor) &&
        (!normalizedSize || variantSize === normalizedSize)
      );
    });

    if (exact) {
      return Number(exact.id);
    }

    throw new Error(
      `Selected variant not found for ${item.name} (${[
        color && `Color: ${color}`,
        size && `Size: ${size}`,
      ]
        .filter(Boolean)
        .join(", ")})`
    );
  }

  return null;
}

async function changeStock(items: OrderItem[]): Promise<ChangedStock[]> {
  const changed: ChangedStock[] = [];

  for (const item of items) {
    const productId = Number(item.id);
    const quantity = Number(item.quantity);

    if (!productId || quantity <= 0) {
      throw new Error(`Invalid product or quantity for ${item.name}`);
    }

    const variantId = await resolveVariantId(item);

    if (variantId) {
      const { data: variant, error } = await supabase
        .from("product_variants")
        .select("id,product_id,stock,color,size,model,is_active")
        .eq("id", variantId)
        .maybeSingle();

      if (error) throw error;

      if (!variant) {
        throw new Error(`Variant not found for ${item.name}`);
      }

      const stock = Number(variant.stock || 0);

      if (stock < quantity) {
        throw new Error(
          `Not enough variant stock for ${item.name}. Available: ${stock}, requested: ${quantity}`
        );
      }

      const { error: updateError } = await supabase
        .from("product_variants")
        .update({ stock: stock - quantity })
        .eq("id", variantId);

      if (updateError) throw updateError;

      changed.push({
        productId,
        variantId,
        quantity,
      });

      continue;
    }

    /*
     * Legacy/non-variant product.
     * Keep the existing products.stock flow intact.
     */
    const { data: product, error } = await supabase
      .from("products")
      .select("id,name,price,cost_price,stock")
      .eq("id", productId)
      .maybeSingle();

    if (error) throw error;

    if (!product) {
      throw new Error(`Product not found: ${item.name}`);
    }

    const stock = Number(product.stock || 0);

    if (stock < quantity) {
      throw new Error(
        `Not enough stock for ${product.name}. Available: ${stock}, requested: ${quantity}`
      );
    }

    const { error: updateError } = await supabase
      .from("products")
      .update({ stock: stock - quantity })
      .eq("id", productId);

    if (updateError) throw updateError;

    changed.push({
      productId,
      variantId: null,
      quantity,
    });
  }

  return changed;
}

async function rollbackStock(items: ChangedStock[]) {
  for (const item of items) {
    if (item.variantId) {
      const { data: variant } = await supabase
        .from("product_variants")
        .select("stock")
        .eq("id", item.variantId)
        .maybeSingle();

      if (!variant) continue;

      await supabase
        .from("product_variants")
        .update({
          stock:
            Number(variant.stock || 0) +
            Number(item.quantity),
        })
        .eq("id", item.variantId);

      continue;
    }

    const { data: product } = await supabase
      .from("products")
      .select("stock")
      .eq("id", item.productId)
      .maybeSingle();

    if (!product) continue;

    await supabase
      .from("products")
      .update({
        stock:
          Number(product.stock || 0) +
          Number(item.quantity),
      })
      .eq("id", item.productId);
  }
}

function isInsideDarEsSalaam(
  latitude: number,
  longitude: number
): boolean {
  return (
    latitude >= -7.05 &&
    latitude <= -6.55 &&
    longitude >= 38.95 &&
    longitude <= 39.45
  );
}

export async function POST(request: Request) {
  let orderLockId = "";
  let changedStock: ChangedStock[] = [];

  try {
    const body = (await request.json()) as OrderBody;

    const {
      id,
      customer,
      location,
      distanceKm,
      deliveryFee,
      deliveryMethod,
      items,
      subtotal,
      discountTotal,
      total,
      status,
      createdAt,
    } = body;

    const orderItems = Array.isArray(items) ? items : [];

    if (!orderItems.length) {
      return NextResponse.json(
        {
          error: "Order has no products.",
        },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        {
          error: "Order number is required.",
        },
        { status: 400 }
      );
    }

    orderLockId = String(id);

    if (processingOrders.has(orderLockId)) {
      return NextResponse.json(
        {
          error: "This order is already being processed.",
        },
        { status: 409 }
      );
    }

    processingOrders.add(orderLockId);

    const { data: existingOrder, error: duplicateError } =
      await supabase
        .from("orders")
        .select("id,order_number")
        .eq("order_number", id)
        .maybeSingle();

    if (duplicateError) throw duplicateError;

    if (existingOrder) {
      return NextResponse.json(
        {
          error: "This order already exists.",
          order: existingOrder,
        },
        { status: 409 }
      );
    }

    const initialStatus = status || "Pending";
    const isPickup = deliveryMethod === "pickup";

    const safeSubtotal = Number(subtotal || 0);

    const latitude =
      location?.latitude != null
        ? Number(location.latitude)
        : null;

    const longitude =
      location?.longitude != null
        ? Number(location.longitude)
        : null;

    if (
      !isPickup &&
      (
        latitude === null ||
        longitude === null ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Delivery location is required.",
        },
        { status: 400 }
      );
    }

    const outsideDar =
      !isPickup &&
      latitude !== null &&
      longitude !== null &&
      !isInsideDarEsSalaam(
        latitude,
        longitude
      );

    const safeDeliveryFee =
      isPickup || outsideDar
        ? 0
        : Number(deliveryFee || 0);

    const safeDistanceKm =
      isPickup || outsideDar
        ? 0
        : Number(distanceKm || 0);

    const safeTotal = isPickup
      ? safeSubtotal
      : Number(
          total ??
            safeSubtotal +
              safeDeliveryFee
        );

    /*
     * REDUCE STOCK
     */
    if (initialStatus !== "Cancelled") {
      changedStock = await changeStock(orderItems);
    }

    /*
     * SAVE ORDER
     */
    const { data, error } = await supabase
      .from("orders")
      .insert({
        id: Date.now(),
        order_number: id,

        customer_name:
          customer?.name || "",

        customer_phone:
          customer?.phone || "",

        customer_email:
          customer?.email || "",

        customer_notes:
          customer?.notes || "",

        customer_address:
          customer?.address || "",

        delivery_method:
          isPickup
            ? "pickup"
            : "delivery",

        latitude:
          latitude,

        longitude:
          longitude,

        distance_km:
          isPickup
            ? null
            : safeDistanceKm,

        delivery_fee:
          safeDeliveryFee,

        items: orderItems,

        subtotal:
          safeSubtotal,

        discount_total:
          Number(discountTotal || 0),

        total:
          safeTotal,

        status:
          initialStatus,

        created_at:
          createdAt ||
          new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      if (changedStock.length) {
        await rollbackStock(changedStock);
      }

      console.error(
        "FAILED TO SAVE ORDER:",
        error
      );

      return NextResponse.json(
        {
          error:
            error.message ||
            "Supabase insert failed",

          code:
            error.code || null,

          details:
            error.details || null,

          hint:
            error.hint || null,
        },
        { status: 500 }
      );
    }

    /*
     * SAVE ORDER ITEMS
     *
     * Existing order_items table requires:
     * order_id
     * product_name
     * price
     * quantity
     * total
     *
     * It also contains the business-control columns.
     */
    const productIds = orderItems.map((item) => Number(item.id));

    const { data: productCosts, error: productCostsError } =
  await supabase
    .from("products")
    .select("id,cost_price")
    .in("id", productIds);

    if (productCostsError) {
      console.error(
        "PRODUCT COSTS LOAD FAILED:",
        productCostsError
      );

      return NextResponse.json(
        {
          error: "Order saved, but product costs could not be loaded.",
          details: productCostsError.message,
          code: productCostsError.code || null,
          hint: productCostsError.hint || null,
        },
        { status: 500 }
      );
    }

    const costMap = new Map<number, number>();

for (const cost of productCosts || []) {
  costMap.set(
    Number(cost.id),
    Number(cost.cost_price || 0)
  );
}

    const orderItemsRows = orderItems.map((item) => {
      const quantity = Number(item.quantity || 1);
      const price = Number(item.price || 0);
      const productId = Number(item.id);

      const costPrice = costMap.get(productId) || 0;

      const subtotal = price * quantity;

      return {
        order_id: Number(data.id),
        order_number: data.order_number,

        product_id: productId,
        product_name: item.name,

        variant_id:
          item.variantId !== undefined &&
          item.variantId !== null
            ? Number(item.variantId)
            : null,

        selected_color:
          item.selectedColor || null,

        selected_size:
          item.selectedSize || null,

        price,
        quantity,
        total: subtotal,

        selling_price_at_sale: price,
        cost_price_at_sale: costPrice,

        discount: 0,
        tax: 0,
        subtotal,

        created_at: new Date().toISOString(),
      };
    });

    const { error: orderItemsError } = await supabase
      .from("order_items")
      .insert(orderItemsRows);

    if (orderItemsError) {
      console.error(
        "ORDER ITEMS SAVE FAILED:",
        orderItemsError
      );

      return NextResponse.json(
        {
          error: "Order saved, but order items could not be saved.",
          details: orderItemsError.message,
          code: orderItemsError.code || null,
          hint: orderItemsError.hint || null,
        },
        { status: 500 }
      );
    }

    console.log(
      "ORDER ITEMS SAVED:",
      orderItemsRows
    );
    /*
     * TELEGRAM NOTIFICATION
     */
    try {
      const {
        orderRobotNotification,
      } = await import(
        "@/lib/robot"
      );

      await orderRobotNotification({
        order_number:
          data.order_number,

        customer_name:
          data.customer_name,

        customer_phone:
          data.customer_phone,

        customer_address:
          data.customer_address,

        location:
          location || null,

        distance_km:
          Number(distanceKm || 0),

        delivery_method:
          deliveryMethod || "delivery",

        items:
          orderItems.map((item) => ({
            ...item,
            image:
              item.image ||
              "",
          })),

        subtotal:
          Number(
            data.subtotal || 0
          ),

        delivery_fee:
          Number(
            data.delivery_fee || 0
          ),

        total:
          Number(
            data.total || 0
          ),

        status:
          data.status ||
          "Pending",
      });
    } catch (telegramError) {
      console.error(
        "Telegram notification failed:",
        telegramError
      );
    }

    return NextResponse.json(
      data,
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Create order error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create order",
      },
      { status: 500 }
    );
  } finally {
    if (orderLockId) {
      processingOrders.delete(
        orderLockId
      );
    }
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const id = String(
      body?.order_number ||
      body?.id ||
      ""
    ).trim();

    if (!id) {
      return NextResponse.json(
        { error: "Order ID is required." },
        { status: 400 }
      );
    }

    const isNumericId = /^\d+$/.test(id);

    let orderQuery = supabase
      .from("orders")
      .select("id,order_number,status,items");

    if (isNumericId) {
      orderQuery = orderQuery.or(
        `order_number.eq.${id},id.eq.${id}`
      );
    } else {
      orderQuery = orderQuery.eq(
        "order_number",
        id
      );
    }

    const { data: order, error: findError } =
      await orderQuery.maybeSingle();

    if (findError) {
      console.error(
        "Failed to find order:",
        findError
      );

      return NextResponse.json(
        {
          error:
            findError.message ||
            "Failed to find order.",
        },
        { status: 500 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    const stockStatuses = [
      "Pending",
      "Confirmed",
      "Processing",
      "Out for Delivery",
      "Delivered",
    ];

    const items = Array.isArray(order.items)
      ? order.items
      : [];

    if (stockStatuses.includes(order.status || "Pending")) {
      for (const item of items) {
        const productId = Number(item?.id);
        const quantity = Number(item?.quantity || 0);
        const explicitVariantId = Number(item?.variantId || 0);

        if (!productId || quantity <= 0) continue;

        let variantId = explicitVariantId > 0
          ? explicitVariantId
          : null;

        /*
         * Old orders may not have variantId in their JSON.
         * Resolve by product + selected colour + selected size.
         */
        if (!variantId && (item?.selectedColor || item?.selectedSize)) {
          let variantQuery = supabase
            .from("product_variants")
            .select("id,stock,color,size")
            .eq("product_id", productId);

          if (item?.selectedColor) {
            variantQuery = variantQuery.ilike(
              "color",
              String(item.selectedColor)
            );
          }

          if (item?.selectedSize) {
            variantQuery = variantQuery.ilike(
              "size",
              String(item.selectedSize)
            );
          }

          const { data: variants } =
            await variantQuery.limit(10);

          const normalizedColor = String(
            item?.selectedColor || ""
          )
            .trim()
            .toLowerCase();

          const normalizedSize = String(
            item?.selectedSize || ""
          )
            .trim()
            .toLowerCase();

          const matchedVariant = (variants || []).find(
            (variant) => {
              const color = String(variant.color || "")
                .trim()
                .toLowerCase();

              const size = String(variant.size || "")
                .trim()
                .toLowerCase();

              return (
                (!normalizedColor || color === normalizedColor) &&
                (!normalizedSize || size === normalizedSize)
              );
            }
          );

          if (matchedVariant) {
            variantId = Number(matchedVariant.id);
          }
        }

        if (variantId) {
          const { data: variant } =
            await supabase
              .from("product_variants")
              .select("stock")
              .eq("id", variantId)
              .maybeSingle();

          if (!variant) continue;

          const { error: stockError } =
            await supabase
              .from("product_variants")
              .update({
                stock:
                  Number(variant.stock || 0) +
                  quantity,
              })
              .eq("id", variantId);

          if (stockError) {
            console.error(
              "Failed to restore variant stock:",
              stockError
            );

            return NextResponse.json(
              {
                error:
                  stockError.message ||
                  "Failed to restore variant stock.",
              },
              { status: 500 }
            );
          }

          continue;
        }

        /*
         * Legacy/non-variant product.
         */
        const { data: product } =
          await supabase
            .from("products")
            .select("stock")
            .eq("id", productId)
            .maybeSingle();

        if (!product) continue;

        const { error: stockError } =
          await supabase
            .from("products")
            .update({
              stock:
                Number(product.stock || 0) +
                quantity,
            })
            .eq("id", productId);

        if (stockError) {
          console.error(
            "Failed to restore stock:",
            stockError
          );

          return NextResponse.json(
            {
              error:
                stockError.message ||
                "Failed to restore product stock.",
            },
            { status: 500 }
          );
        }
      }
    }

    const { error: deleteError } =
      await supabase
        .from("orders")
        .delete()
        .eq("id", order.id);

    if (deleteError) {
      console.error(
        "Failed to delete order:",
        deleteError
      );

      return NextResponse.json(
        {
          error:
            deleteError.message ||
            "Failed to delete order.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted: id,
    });

  } catch (error: any) {
    console.error(
      "DELETE ORDER ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Failed to delete order.",
      },
      { status: 500 }
    );
  }
}
