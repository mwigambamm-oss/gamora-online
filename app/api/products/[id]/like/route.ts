import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Supabase service role environment variable is missing");
  }

  return createClient(url, serviceKey);
}

async function getAuthenticatedUser(request: Request) {
  const serverSupabase = await createSupabaseServerClient();

  const {
    data: { user: cookieUser },
  } = await serverSupabase.auth.getUser();

  if (cookieUser) {
    return cookieUser;
  }

  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.replace("Bearer ", "").trim();

  if (!token) {
    return null;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    return null;
  }

  const authClient = createClient(url, publishableKey);

  const {
    data: { user },
  } = await authClient.auth.getUser(token);

  return user;
}

async function getLikeState(
  productId: number,
  userId?: string
) {
  const admin = getAdminClient();

  const { data: product, error: productError } = await admin
    .from("products")
    .select("likes, orders_count")
    .eq("id", productId)
    .single();

  if (productError || !product) {
    throw new Error("Product not found");
  }

  const { count, error: countError } = await admin
    .from("product_likes")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("product_id", productId);

  if (countError) {
    throw new Error(countError.message);
  }

  let liked = false;

  if (userId) {
    const { data: existingLike, error: likeError } = await admin
      .from("product_likes")
      .select("id")
      .eq("product_id", productId)
      .eq("user_id", userId)
      .maybeSingle();

    if (likeError) {
      throw new Error(likeError.message);
    }

    liked = Boolean(existingLike);
  }

  const baselineLikes = Math.max(
    200,
    Number(product.likes || 200)
  );

  const orders = Math.max(
    300,
    Number(product.orders_count || 300)
  );

  return {
    likes: baselineLikes + Number(count || 0),
    orders,
    liked,
    authenticated: Boolean(userId),
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const user = await getAuthenticatedUser(request);

    const state = await getLikeState(
      productId,
      user?.id
    );

    return NextResponse.json(state, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Like GET error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load like state",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        {
          error: "LOGIN_REQUIRED",
          message: "Please login to like this product.",
        },
        { status: 401 }
      );
    }

    const admin = getAdminClient();

    const { data: existingLike, error: existingError } =
      await admin
        .from("product_likes")
        .select("id")
        .eq("product_id", productId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (existingError) {
      throw new Error(existingError.message);
    }

    let liked = false;

    if (existingLike) {
      const { error: deleteError } = await admin
        .from("product_likes")
        .delete()
        .eq("id", existingLike.id)
        .eq("user_id", user.id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      liked = false;
    } else {
      const { error: insertError } = await admin
        .from("product_likes")
        .insert({
          product_id: productId,
          user_id: user.id,
        });

      if (insertError) {
        if (insertError.code === "23505") {
          liked = true;
        } else {
          throw new Error(insertError.message);
        }
      } else {
        liked = true;
      }
    }

    const state = await getLikeState(
      productId,
      user.id
    );

    return NextResponse.json({
      ...state,
      liked,
    }, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Like POST error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update like",
      },
      { status: 500 }
    );
  }
}
