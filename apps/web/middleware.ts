import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl;

  const protectedPrefixes = ["/reports", "/projects", "/settings", "/billing"];
  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));

  if (isProtected) {
    const session = (req as { auth: unknown }).auth;
    if (!session) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/reports/:path*", "/projects/:path*", "/settings/:path*", "/billing/:path*"],
};
