import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const username = String(body.username || "").trim();
    const recoveryCode = String(body.recoveryCode || "").trim();
    const newPassword = String(body.newPassword || "");
    const confirmPassword = String(body.confirmPassword || "");

    if (
      !username ||
      !recoveryCode ||
      !newPassword ||
      !confirmPassword
    ) {
      return NextResponse.json(
        {
          error:
            "Username, recovery code and password fields are required.",
        },
        { status: 400 }
      );
    }

    const configuredCode =
      process.env.ADMIN_RECOVERY_CODE || "";

    if (!configuredCode) {
      console.error("ADMIN_RECOVERY_CODE is missing.");

      return NextResponse.json(
        {
          error: "Admin recovery is not configured.",
        },
        { status: 500 }
      );
    }

    if (recoveryCode !== configuredCode) {
      return NextResponse.json(
        {
          error: "Invalid recovery code.",
        },
        { status: 401 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          error:
            "New password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          error: "Passwords do not match.",
        },
        { status: 400 }
      );
    }

    const {
      data: admin,
      error: lookupError,
    } = await supabase
      .from("admin_credentials")
      .select("id, username")
      .eq("username", username)
      .maybeSingle();

    if (lookupError) {
      console.error(
        "Admin recovery lookup error:",
        lookupError
      );

      return NextResponse.json(
        {
          error: "Unable to verify admin account.",
        },
        { status: 500 }
      );
    }

    if (!admin) {
      return NextResponse.json(
        {
          error: "Admin account was not found.",
        },
        { status: 404 }
      );
    }

    const {
      error: updateError,
    } = await supabase
      .from("admin_credentials")
      .update({
        password: newPassword,
        updated_at: new Date().toISOString(),
      })
      .eq("id", admin.id);

    if (updateError) {
      console.error(
        "Admin recovery password update error:",
        updateError
      );

      return NextResponse.json(
        {
          error: "Unable to save the new password.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Admin password changed successfully.",
    });
  } catch (error) {
    console.error(
      "Admin recovery error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to process password recovery.",
      },
      { status: 500 }
    );
  }
}
