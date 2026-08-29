import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();

    const session = cookieStore.get("gamora_admin_session")?.value;
    const username = cookieStore.get("gamora_admin_username")?.value;

    if (session !== "authenticated" || !username) {
      return NextResponse.json(
        { error: "Admin session is invalid." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const currentPassword = String(
      body.currentPassword || body.oldPassword || ""
    );

    const newPassword = String(body.newPassword || "");

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          error: "Current password and new password are required.",
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          error: "New password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        {
          error:
            "New password must be different from the current password.",
        },
        { status: 400 }
      );
    }

    const { data: admin, error: fetchError } = await supabase
      .from("admin_settings")
      .select("id, username, email, password")
      .eq("username", username)
      .maybeSingle();

    if (fetchError) {
      console.error("Change password lookup error:", fetchError);

      return NextResponse.json(
        { error: "Unable to verify admin account." },
        { status: 500 }
      );
    }

    if (!admin) {
      return NextResponse.json(
        { error: "Admin account was not found." },
        { status: 404 }
      );
    }

    if (currentPassword !== admin.password) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 401 }
      );
    }

    const { error: updateError } = await supabase
      .from("admin_settings")
      .update({
        password: newPassword,
        updated_at: new Date().toISOString(),
      })
      .eq("id", admin.id);

    if (updateError) {
      console.error("Change password update error:", updateError);

      return NextResponse.json(
        { error: "Unable to save the new password." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return NextResponse.json(
      { error: "Unable to change password." },
      { status: 500 }
    );
  }
}
