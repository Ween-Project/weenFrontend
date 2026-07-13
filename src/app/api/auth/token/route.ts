import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!accessToken) {
    return NextResponse.json({ message: "No active session." }, { status: 401 });
  }
  return NextResponse.json({ token: accessToken });
}
