
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

async function getAdminDatabase() {
  const cookieStore = await cookies();

  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Cookies may be managed by the proxy.
          }
        },
      },
    }
  );

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (
    authError ||
    user?.email?.toLowerCase() !== "officialgamoraonline@gmail.com"
  ) {
    return { error: "Unauthorized", status: 403 as const };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return {
      error: "Server database configuration is missing.",
      status: 500 as const,
    };
  }

  return {
    database: createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }),
  };
}

// ADD PRODUCT
export async function POST(request: Request) {
  try {
    const result = await getAdminDatabase();

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    const product = await request.json();

    if (
      !product.name ||
      !product.category ||
      !Number.isFinite(Number(product.price))
    ) {
      return NextResponse.json(
        { error: "Product name, category and valid price are required." },
        { status: 400 }
      );
    }

    const { data, error } = await result.database
      .from("products")
      .insert(product)
      .select("*")
      .single();

    if (error) {
      console.error("Admin product insert failed:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Admin product API failed:", error);
    return NextResponse.json(
      { error: "Unable to save product. Please try again." },
      { status: 500 }
    );
  }
}

// UPDATE PRODUCT AND STOCK
export async function PUT(request: Request) {
  try {
    const result = await getAdminDatabase();

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    const body = await request.json();

    const productId = body.id ?? body.productId;
    const updates = body.product ?? body.updates;

    if (
      productId === undefined ||
      productId === null ||
      !/^\d+$/.test(String(productId))
    ) {
      return NextResponse.json(
        { error: "A valid product ID is required." },
        { status: 400 }
      );
    }

    if (
      !updates ||
      typeof updates !== "object" ||
      Array.isArray(updates) ||
      Object.keys(updates).length === 0
    ) {
      return NextResponse.json(
        { error: "Product update data is required." },
        { status: 400 }
      );
    }

    // Never allow the update payload to change the product ID.
    const { id, productId: ignoredId, ...safeUpdates } = updates;

    const { data, error } = await result.database
      .from("products")
      .update(safeUpdates)
      .eq("id", productId)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("Admin product update failed:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Product not found or no product was updated." },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Admin product update API failed:", error);
    return NextResponse.json(
      { error: "Unable to update product. Please try again." },
      { status: 500 }
    );
  }
}
