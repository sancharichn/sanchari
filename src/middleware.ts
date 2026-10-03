import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * First line of defence for /admin: anyone without an ADMIN token sees the
 * 404 page, so the area's existence isn't advertised. The admin layout,
 * every admin action and the CSV route check the role again against the
 * database, so a stale token can't outlive a role change.
 */
export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (token?.role !== "ADMIN") {
    return NextResponse.rewrite(new URL("/404", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
