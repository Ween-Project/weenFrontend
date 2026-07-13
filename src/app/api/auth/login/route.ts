import { NextRequest, NextResponse } from "next/server";
import { backendUrl, type BackendAuthEnvelope, parseBackendResponse, setSessionCookies } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
  try {
    const input = (await request.json()) as { email?: string; password?: string; accountType?: "user" | "organization" };
    if (input.accountType !== "user" && input.accountType !== "organization") {
      return NextResponse.json({ message: "A valid account type is required." }, { status: 400 });
    }
    const endpoint = input.accountType === "organization" ? "/api/v1/auth/login/organization" : "/api/v1/auth/login";
    const backend = await fetch(backendUrl(endpoint), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: input.email, password: input.password }),
      cache: "no-store",
    });
    const { body } = await parseBackendResponse(backend);
    if (!backend.ok) return NextResponse.json(body, { status: backend.status });

    const auth = (body as BackendAuthEnvelope).data;
    const account = auth?.user ?? auth?.organization;
    if (!auth || !account || !auth.accessToken || !auth.refreshToken) {
      return NextResponse.json({ message: "The backend returned an incomplete login response." }, { status: 502 });
    }
    const response = NextResponse.json({ account });
    setSessionCookies(response, auth);
    return response;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: "The login request is not valid JSON." }, { status: 400 });
    }
    return NextResponse.json(
      { message: "The authentication service is unavailable. Make sure the Spring Boot backend is running on port 5050." },
      { status: 503 },
    );
  }
}
