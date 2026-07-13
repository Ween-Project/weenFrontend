import { NextRequest, NextResponse } from "next/server";
import { backendUrl } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  try {
    const backend = await fetch(backendUrl(`/api/v1/invitations/reject?token=${encodeURIComponent(token)}`), {
      method: "GET",
      cache: "no-store",
    });

    if (backend.ok) {
      return NextResponse.redirect(
        new URL("/login?message=" + encodeURIComponent("Invitation rejected successfully."), request.url)
      );
    } else {
      const errorMsg = backend.status === 404 ? "Invitation link not found or expired." : "Failed to reject invitation.";
      return NextResponse.redirect(
        new URL("/login?error=" + encodeURIComponent(errorMsg), request.url)
      );
    }
  } catch {
    return NextResponse.redirect(
      new URL("/login?error=" + encodeURIComponent("Unable to connect to server. Please try again."), request.url)
    );
  }
}
