import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const GUEST_COOKIE = "gamora_guest_id";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Supabase service role environment variable is missing");
  }

  return createClient(url, serviceKey);
}

function getGuestId(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";

  const match = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${GUEST_COOKIE}=`));

  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

function createGuestId() {
  return crypto.randomUUID();
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
  userId?: string,
  guestId?: string
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
  } else if (guestId) {
    const { data: existingLike, error: likeError } = await admin
      .from("product_likes")
      .select("id")
      .eq("product_id", productId)
      .eq("guest_id", guestId)
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

function applyGuestCookie(
  response: NextResponse,
  guestId: string,
  shouldSetCookie: boolean
) {
  if (shouldSetCookie) {
    response.cookies.set({
      name: GUEST_COOKIE,
      value: guestId,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
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

    let guestId = getGuestId(request);
    const shouldSetGuestCookie = !user && !guestId;

    if (!user && !guestId) {
      guestId = createGuestId();
    }

    const state = await getLikeState(
      productId,
      user?.id,
      user ? undefined : guestId || undefined
    );

    const response = NextResponse.json(state, {
      headers: {
        "Cache-Control": "no-store",
      },
    });

    if (!user && guestId) {
      applyGuestCookie(response, guestId, shouldSetGuestCookie);
    }

    return response;
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

    let guestId = getGuestId(request);
    const shouldSetGuestCookie = !user && !guestId;

    if (!user && !guestId) {
      guestId = createGuestId();
    }

    const admin = getAdminClient();

    let existingLike: { id: number } | null = null;

    if (user) {
      const { data, error } = await admin
        .from("product_likes")
        .select("id")
        .eq("product_id", productId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      existingLike = data;
    } else if (guestId) {
      const { data, error } = await admin
        .from("product_likes")
        .select("id")
        .eq("product_id", productId)
        .eq("guest_id", guestId)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      existingLike = data;
    }

    let liked = false;

    if (existingLike) {
      let deleteQuery = admin
        .from("product_likes")
        .delete()
        .eq("id", existingLike.id)
        .eq("product_id", productId);

      if (user) {
        deleteQuery = deleteQuery.eq("user_id", user.id);
      } else if (guestId) {
        deleteQuery = deleteQuery.eq("guest_id", guestId);
      }

      const { error: deleteError } = await deleteQuery;

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      liked = false;
    } else {
      const { error: insertError } = user
        ? await admin
            .from("product_likes")
            .insert({
              product_id: productId,
              user_id: user.id,
            })
        : await admin
            .from("product_likes")
            .insert({
              product_id: productId,
              guest_id: guestId!,
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
      user?.id,
      user ? undefined : guestId || undefined
    );

    const response = NextResponse.json(
      {
        ...state,
        liked,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );

    if (!user && guestId) {
      applyGuestCookie(response, guestId, shouldSetGuestCookie);
    }

    return response;
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
