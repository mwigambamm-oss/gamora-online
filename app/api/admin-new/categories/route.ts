import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";

function publicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}

async function authenticatedUser() {
  const cookieStore = await cookies();

  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(values) {
          try {
            values.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Cookies may be read-only in this request context.
          }
        },
      },
    }
  );

  const { data, error } = await authClient.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

function adminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// Public category list for the homepage and category pages.
export async function GET() {
  try {
    const { data, error } = await adminClient()
      .from("product_categories")
      .select("id,name,image_url")
      .order("name");

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ categories: data ?? [] });
  } catch {
    return NextResponse.json(
      { error: "Unable to load categories." },
      { status: 500 }
    );
  }
}

// Save a category and its optional image.
export async function POST(request: Request) {
  try {
    const user = await authenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to manage categories." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const name = String(formData.get("name") ?? "").trim();
    const image = formData.get("image");

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required." },
        { status: 400 }
      );
    }

    const db = adminClient();
    let imageUrl: string | null = null;

    if (image instanceof File && image.size > 0) {
      if (!image.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "Please select an image file." },
          { status: 400 }
        );
      }

      if (image.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Image must be 5 MB or smaller." },
          { status: 400 }
        );
      }

      const extension = image.name.split(".").pop()?.toLowerCase() || "jpg";
      const safeExtension = /^[a-z0-9]+$/.test(extension)
        ? extension
        : "jpg";
      const path = `categories/${crypto.randomUUID()}.${safeExtension}`;

      const { error: uploadError } = await db.storage
        .from("product-images")
        .upload(path, image, {
          contentType: image.type,
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json(
          { error: `Image upload failed: ${uploadError.message}` },
          { status: 500 }
        );
      }

      imageUrl = db.storage
        .from("product-images")
        .getPublicUrl(path).data.publicUrl;
    }

    const values: { name: string; image_url?: string } = { name };

    if (imageUrl) {
      values.image_url = imageUrl;
    }

    const { data, error } = await db
      .from("product_categories")
      .upsert(values, { onConflict: "name" })
      .select("id,name,image_url")
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ category: data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save category.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Update an existing category name and/or image.
export async function PATCH(request: Request) {
  try {
    const user = await authenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to manage categories." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const id = Number(formData.get("id"));
    const name = String(formData.get("name") ?? "").trim();
    const image = formData.get("image");

    if (!Number.isInteger(id) || id <= 0 || !name) {
      return NextResponse.json(
        { error: "A valid category ID and name are required." },
        { status: 400 }
      );
    }

    const db = adminClient();
    const values: { name: string; image_url?: string } = { name };

    if (image instanceof File && image.size > 0) {
      if (!image.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "Please select an image file." },
          { status: 400 }
        );
      }

      if (image.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Image must be 5 MB or smaller." },
          { status: 400 }
        );
      }

      const extension = image.name.split(".").pop()?.toLowerCase() || "jpg";
      const safeExtension = /^[a-z0-9]+$/.test(extension) ? extension : "jpg";
      const storagePath = `categories/${crypto.randomUUID()}.${safeExtension}`;

      const { error: uploadError } = await db.storage
        .from("product-images")
        .upload(storagePath, image, {
          contentType: image.type,
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json(
          { error: `Image upload failed: ${uploadError.message}` },
          { status: 500 }
        );
      }

      values.image_url = db.storage
        .from("product-images")
        .getPublicUrl(storagePath).data.publicUrl;
    }

    const { data, error } = await db
      .from("product_categories")
      .update(values)
      .eq("id", id)
      .select("id,name,image_url")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ category: data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update category.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
