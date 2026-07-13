import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has("ween_access") || request.cookies.has("ween_refresh");
  if (!hasSession) {
    const login = new URL("/login", request.url);
    login.searchParams.set("message", "Please sign in to continue.");
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/events/new", "/events/:id/edit", "/posts/:path*", "/settings/:path*", "/admin/:path*", "/messages/:path*", "/notifications/:path*", "/network/:path*"],
};
