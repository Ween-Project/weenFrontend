import { NextRequest, NextResponse } from "next/server";
import { PROFILE_COOKIE } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
  try {
    const { account } = await request.json();
    if (!account) {
      return NextResponse.json({ message: "Account data is required." }, { status: 400 });
    }

    const profile = request.cookies.get(PROFILE_COOKIE)?.value;
    const currentAccount = profile ? JSON.parse(profile) : {};

    const updatedAccount = { ...currentAccount, ...account };

    const response = NextResponse.json({ account: updatedAccount });
    const common = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
    response.cookies.set(PROFILE_COOKIE, JSON.stringify(updatedAccount), { ...common, maxAge: 604800 });

    return response;
  } catch (e) {
    return NextResponse.json({ message: "Failed to update session." }, { status: 500 });
  }
}
