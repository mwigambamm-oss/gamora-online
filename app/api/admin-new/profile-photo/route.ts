import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const ADMIN_EMAIL = "officialgamoraonline@gmail.com";
const BUCKET = "product-images";
const PHOTO_PATH = "admin/admin-profile";

async function authenticatedAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase authentication configuration is missing.");
  }

  const cookieStore = await cookies();
  const authClient = createServerClient(url, key, {
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
  });

  const { data, error } = await authClient.auth.getUser();

  if (error || data.user?.email?.toLowerCase() !== ADMIN_EMAIL) {
    return null;
  }

  return data.user;
}

function storageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase server storage configuration is missing.");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function GET() {
  try {
    const user = await authenticatedAdmin();

    if (!user) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const db = storageClient();
    const { data } = db.storage.from(BUCKET).getPublicUrl(PHOTO_PATH);

    return NextResponse.json(
      { url: data.publicUrl },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Admin photo lookup failed:", error);
    return NextResponse.json(
      { error: "Could not load the administrator photo." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await authenticatedAdmin();

    if (!user) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const formData = await request.formData();
    const photo = formData.get("photo");

    if (!(photo instanceof File)) {
      return NextResponse.json({ error: "Choose a photo first." }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(photo.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG and WebP images are accepted." },
        { status: 400 }
      );
    }

    if (photo.size === 0 || photo.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "The image must be smaller than 5 MB." },
        { status: 400 }
      );
    }

    const db = storageClient();
    const { error: uploadError } = await db.storage
      .from(BUCKET)
      .upload(PHOTO_PATH, photo, {
        contentType: photo.type,
        upsert: true,
        cacheControl: "0",
      });

    if (uploadError) {
      console.error("Admin photo upload failed:", uploadError);
      return NextResponse.json(
        {
          error: "Upload failed. Confirm that the product-images bucket is public and accessible.",
        },
        { status: 500 }
      );
    }

    const { data } = db.storage.from(BUCKET).getPublicUrl(PHOTO_PATH);
    const separator = data.publicUrl.includes("?") ? "&" : "?";

    return NextResponse.json({
      url: `${data.publicUrl}${separator}updated=${Date.now()}`,
    });
  } catch (error) {
    console.error("Admin photo upload error:", error);
    return NextResponse.json(
      { error: "Could not save the administrator photo." },
      { status: 500 }
    );
  }
}
