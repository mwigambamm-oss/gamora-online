import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
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
      return NextResponse.json(
        { error: "Only the authorized Gamora administrator can add products." },
        { status: 403 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json(
        { error: "Server database configuration is missing." },
        { status: 500 }
      );
    }

    const product = await request.json();

    if (!product.name || !product.category || !Number.isFinite(Number(product.price))) {
      return NextResponse.json(
        { error: "Product name, category and valid price are required." },
        { status: 400 }
      );
    }

    const database = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await database
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
