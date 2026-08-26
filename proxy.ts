import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * Public admin authentication pages.
   * These MUST remain accessible without an admin session.
   */
  const publicAdminPaths = [
    "/admin/login",
    "/admin/forgot-password",
    "/admin/reset-password",
  ];

  if (publicAdminPaths.includes(pathname)) {
    return NextResponse.next();
  }

  /*
   * Protect all other /admin pages.
   */
  if (pathname.startsWith("/admin")) {
    const session = request.cookies.get(
      "gamora_admin_session"
    )?.value;

    const username = request.cookies.get(
      "gamora_admin_username"
    )?.value;

    if (
      session !== "authenticated" ||
      !username
    ) {
      const loginUrl = new URL(
        "/admin/login",
        request.url
      );

      loginUrl.searchParams.set(
        "redirect",
        pathname
      );

      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
  ],
};
