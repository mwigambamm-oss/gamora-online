import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const username = String(body.username || "").trim();
    const password = String(body.password || "");

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc(
      "verify_admin_login",
      {
        p_username: username,
        p_password: password,
      }
    );

    if (error) {
      console.error("Admin login RPC error:", error);

      return NextResponse.json(
        { error: "Unable to verify admin account." },
        { status: 500 }
      );
    }

    const admin = data?.[0];

    if (!admin) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      username: admin.username,
    });

    response.cookies.set(
      "gamora_admin_session",
      "authenticated",
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      }
    );

    response.cookies.set(
      "gamora_admin_username",
      admin.username,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      }
    );

    return response;
  } catch (error) {
    console.error("Admin login error:", error);

    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}
