import { NextResponse } from "next/server";
import type { Account, ApiEnvelope } from "@/types";

export const ACCESS_COOKIE = "ween_access";
export const REFRESH_COOKIE = "ween_refresh";
export const PROFILE_COOKIE = "ween_profile";

export function backendUrl(path: string) {
  const base = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050";
  return `${base.replace(/\/$/, "")}${path}`;
}

export function accountFromAuth(data: {
  user?: Account;
  organization?: Account;
}): Account {
  const account = data.user ?? data.organization;
  if (!account) throw new Error("Authentication response did not include an account.");
  return account;
}

export function setSessionCookies(
  response: NextResponse,
  auth: { accessToken: string; refreshToken: string; expiresIn: number; user?: Account; organization?: Account },
) {
  const account = accountFromAuth(auth);
  const accessSeconds = Math.max(1, Math.floor(auth.expiresIn / 1000));
  const common = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
  response.cookies.set(ACCESS_COOKIE, auth.accessToken, { ...common, maxAge: accessSeconds });
  response.cookies.set(REFRESH_COOKIE, auth.refreshToken, { ...common, maxAge: 604800 });
  response.cookies.set(PROFILE_COOKIE, JSON.stringify(account), { ...common, maxAge: 604800 });
}

export function clearSessionCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, "", { maxAge: 0, path: "/" });
  response.cookies.set(REFRESH_COOKIE, "", { maxAge: 0, path: "/" });
  response.cookies.set(PROFILE_COOKIE, "", { maxAge: 0, path: "/" });
}

export async function parseBackendResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : { message: response.statusText || "Backend request failed." };
  return { body, contentType };
}

export type BackendAuthEnvelope = ApiEnvelope<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user?: Account;
  organization?: Account;
}>;
