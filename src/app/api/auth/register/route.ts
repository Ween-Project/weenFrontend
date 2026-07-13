import { NextRequest, NextResponse } from "next/server";
import { backendUrl, type BackendAuthEnvelope, parseBackendResponse, setSessionCookies } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
  try {
    const input = (await request.json()) as Record<string, unknown> & { accountType?: "user" | "organization" };
    const { accountType, ...payload } = input;
    if (accountType !== "user" && accountType !== "organization") {
      return NextResponse.json({ message: "A valid account type is required." }, { status: 400 });
    }
    if (typeof payload.email === "string" && payload.email.length > 150) {
      return NextResponse.json(
        { message: "Request validation failed", fieldErrors: { email: "Email must not exceed 150 characters." } },
        { status: 400 },
      );
    }
    if (accountType === "user" && typeof payload.course === "string" && payload.course.length > 10) {
      return NextResponse.json(
        { message: "Request validation failed", fieldErrors: { course: "Course must not exceed 10 characters." } },
        { status: 400 },
      );
    }

    const ref = (payload.referralCode as string | undefined)?.trim() || "";
    delete payload.referralCode;

    const refParam = ref ? `?ref=${encodeURIComponent(ref)}` : "";
    const endpoint = accountType === "organization" ? "/api/v1/auth/register/organization" : `/api/v1/auth/register${refParam}`;
    
    const fd = new FormData();
    fd.append("request", new Blob([JSON.stringify(payload)], { type: "application/json" }));

    const backend = await fetch(backendUrl(endpoint), {
      method: "POST",
      body: fd,
      cache: "no-store",
    });
    const { body } = await parseBackendResponse(backend);

    if (!backend.ok) return NextResponse.json(body, { status: backend.status });

    const auth = (body as BackendAuthEnvelope).data;
    const account = auth?.user ?? auth?.organization;
    if (!auth || !account || !auth.accessToken || !auth.refreshToken) {
      return NextResponse.json({ message: "The backend returned an incomplete registration response." }, { status: 502 });
    }
    const response = NextResponse.json({ account }, { status: 201 });
    setSessionCookies(response, auth);
    return response;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: "The registration request is not valid JSON." }, { status: 400 });
    }
    return NextResponse.json(
      { message: "The authentication service is unavailable. Make sure the Spring Boot backend is running on port 5050." },
      { status: 503 },
    );
  }
}
