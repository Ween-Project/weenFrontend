import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, PROFILE_COOKIE, REFRESH_COOKIE, backendUrl, clearSessionCookies } from "@/lib/server-auth";
import type { Account, ApiEnvelope } from "@/types";

export async function GET(request: NextRequest) {
  let accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  const profile = request.cookies.get(PROFILE_COOKIE)?.value;

  if (!profile || (!accessToken && !refreshToken)) {
    return NextResponse.json({ message: "No active session." }, { status: 401 });
  }

  let account: Account;
  try { account = JSON.parse(profile) as Account; }
  catch {
    const invalid = NextResponse.json({ message: "Invalid session profile." }, { status: 401 });
    clearSessionCookies(invalid);
    return invalid;
  }

  if (accessToken) {
    const validation = await fetch(backendUrl("/api/v1/users/me"), {
      headers: { Cookie: `accessToken=${accessToken}` },
      cache: "no-store",
    }).catch(() => null);
    if (validation?.ok) return NextResponse.json({ account });
  }

  if (refreshToken) {
    const refresh = await fetch(backendUrl("/api/v1/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
    if (!refresh.ok) {
      const expired = NextResponse.json({ message: "Your session has expired." }, { status: 401 });
      clearSessionCookies(expired);
      return expired;
    }
    const payload = (await refresh.json()) as ApiEnvelope<string>;
    accessToken = payload.data;
    const response = NextResponse.json({ account });
    response.cookies.set(ACCESS_COOKIE, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 900,
    });
    return response;
  }

  const expired = NextResponse.json({ message: "Your session has expired." }, { status: 401 });
  clearSessionCookies(expired);
  return expired;
}
