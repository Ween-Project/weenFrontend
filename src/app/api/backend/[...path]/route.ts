import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE, backendUrl, clearSessionCookies } from "@/lib/server-auth";
import type { ApiEnvelope } from "@/types";

async function forward(request: NextRequest, path: string[], body: ArrayBuffer | undefined, accessToken?: string) {
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  if (accessToken) headers.set("Cookie", `accessToken=${accessToken}`);
  const method = request.method;
  return fetch(backendUrl(`/${path.join("/")}${request.nextUrl.search}`), {
    method,
    headers,
    body,
    cache: "no-store",
  });
}

async function handler(request: NextRequest, context: { params: { path: string[] } }) {
  let accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer();
  let backend = await forward(request, context.params.path, body, accessToken);
  let refreshedToken: string | undefined;

  if (backend.status === 401) {
    const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
    if (refreshToken) {
      const refresh = await fetch(backendUrl("/api/v1/auth/refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      });
      if (refresh.ok) {
        const payload = (await refresh.json()) as ApiEnvelope<string>;
        refreshedToken = payload.data;
        accessToken = refreshedToken;
        backend = await forward(request, context.params.path, body, accessToken);
      }
    }
  }

  const responseBody = await backend.arrayBuffer();
  const response = new NextResponse(responseBody, {
    status: backend.status,
    headers: { "Content-Type": backend.headers.get("content-type") || "application/json" },
  });
  if (refreshedToken) {
    response.cookies.set(ACCESS_COOKIE, refreshedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 900,
    });
  } else if (backend.status === 401) {
    clearSessionCookies(response);
  }
  return response;
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
