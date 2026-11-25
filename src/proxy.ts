import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_HOME_ONLY !== "1") return NextResponse.next();

  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/photos") ||
    pathname === "/logo.png" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const langHome = pathname.match(/^\/(fr|ar)\/?$/);
  if (langHome) return NextResponse.next();

  const nested = pathname.match(/^\/(fr|ar)\/.+/);
  if (nested) {
    return NextResponse.redirect(new URL(`/${nested[1]}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
