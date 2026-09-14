import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const publicSupabase = createClient(
  supabaseUrl,
  publishableKey
);

const adminSupabase = createClient(
  supabaseUrl,
  serviceRoleKey
);

async function getUser(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice(7);

  const {
    data: { user },
    error,
  } = await publicSupabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const productId = Number(id);

    if (!Number.isFinite(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID." },
        { status: 400 }
      );
    }

    const { data: product, error: productError } =
      await adminSupabase
        .from("products")
        .select("id,likes,orders_count")
        .eq("id", productId)
        .maybeSingle();

    if (productError) throw productError;

    if (!product) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    const { count, error: countError } =
      await adminSupabase
        .from("product_likes")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("product_id", productId);

    if (countError) throw countError;

    const user = await getUser(request);

    let liked = false;

    if (user) {
      const { data: userLike } = await adminSupabase
        .from("product_likes")
        .select("id")
        .eq("product_id", productId)
        .eq("user_id", user.id)
        .maybeSingle();

      liked = !!userLike;
    }

    const baselineLikes = Math.max(
      200,
      Number(product.likes || 200)
    );

    const realLikes = Number(count || 0);

    return NextResponse.json({
      likes: baselineLikes + realLikes,
      orders: Math.max(
        300,
        Number(product.orders_count || 300)
      ),
      liked,
      authenticated: !!user,
    });
  } catch (error) {
    console.error("Like GET error:", error);

    return NextResponse.json(
      { error: "Failed to load product social proof." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const productId = Number(id);

    if (!Number.isFinite(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID." },
        { status: 400 }
      );
    }

    const user = await getUser(request);

    if (!user) {
      return NextResponse.json(
        {
          error: "Please login to like this product.",
        },
        { status: 401 }
      );
    }

    const { data: existingLike } =
      await adminSupabase
        .from("product_likes")
        .select("id")
        .eq("product_id", productId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (existingLike) {
      const { error } = await adminSupabase
        .from("product_likes")
        .delete()
        .eq("id", existingLike.id);

      if (error) throw error;

      return NextResponse.json({
        liked: false,
      });
    }

    const { error } = await adminSupabase
      .from("product_likes")
      .insert({
        product_id: productId,
        user_id: user.id,
      });

    if (error) throw error;

    return NextResponse.json({
      liked: true,
    });
  } catch (error) {
    console.error("Like POST error:", error);

    return NextResponse.json(
      { error: "Failed to update product like." },
      { status: 500 }
    );
  }
}
