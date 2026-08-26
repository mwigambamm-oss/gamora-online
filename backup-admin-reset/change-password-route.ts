import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();

    const session = cookieStore.get(
      "gamora_admin_session"
    )?.value;

    if (session !== "authenticated") {
      return NextResponse.json(
        { error: "Admin session is invalid." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const currentPassword = String(
      body.currentPassword || ""
    );

    const newPassword = String(
      body.newPassword || ""
    );

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const adminUsername =
      process.env.ADMIN_USERNAME;

    const adminPassword =
      process.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      return NextResponse.json(
        { error: "Admin credentials are not configured." },
        { status: 500 }
      );
    }

    if (currentPassword !== adminPassword) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Password verified. Password storage is ready.",
    });
  } catch (error) {
    console.error(
      "Change password error:",
      error
    );

    return NextResponse.json(
      { error: "Unable to change password." },
      { status: 500 }
    );
  }
}
