// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const accessToken = req.cookies.get("access_token")?.value; // check access_token cookie

  // If no token and trying to access protected pages
  if (!accessToken && req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

// Apply only to routes you want protected
export const config = {
  matcher: ["/dashboard/:path*"], // protect all dashboard routes
};
