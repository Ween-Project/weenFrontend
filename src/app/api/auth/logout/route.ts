import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, backendUrl, clearSessionCookies } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  if (accessToken) {
    await fetch(backendUrl("/api/v1/auth/logout"), {
      method: "POST",
      headers: { Cookie: `accessToken=${accessToken}` },
      cache: "no-store",
    }).catch(() => undefined);
  }
  const response = NextResponse.json({ success: true });
  clearSessionCookies(response);
  return response;
}
