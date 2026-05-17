import { NextResponse, type NextRequest } from "next/server";

// Placement portal is currently disabled (gateway has the /placement
// mount commented out, and the landing page no longer lists it). This
// middleware bounces any direct hit on /placement/* back to the root
// so the routes don't render half-broken UI against a 404 backend.
//
// To re-enable: delete this file (or remove the /placement matcher).
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/placement")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/placement/:path*"],
};
