import { NextResponse } from "next/server";
import { AUTH_COOKIE, verifyAdminToken } from "@/lib/token";

/**
 * Optimistic guard for admin PAGES (Next 16 "proxy", formerly middleware): no valid session
 * cookie -> redirect to the login page. This is only a fast first check. The real authorization
 * (is the admin still active?) happens in the admin layout and, for every API route,
 * in middleware/routeHandler.js.
 */
export async function proxy(request) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const session = await verifyAdminToken(request.cookies.get(AUTH_COOKIE)?.value);
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
