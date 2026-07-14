import { NextRequest, NextResponse } from "next/server";
import { backendUrl, type BackendAuthEnvelope, parseBackendResponse, setSessionCookies } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
  try {
    let payload: Record<string, any> = {};
    let profilePhoto: File | null = null;
    let logo: File | null = null;
    let banner: File | null = null;
    let accountType: "user" | "organization" | null = null;

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      profilePhoto = formData.get("profilePhoto") as File | null;
      logo = formData.get("logo") as File | null;
      banner = formData.get("banner") as File | null;
      accountType = formData.get("accountType") as "user" | "organization" | null;

      formData.forEach((value, key) => {
        if (key !== "profilePhoto" && key !== "logo" && key !== "banner" && key !== "accountType") {
          payload[key] = value;
        }
      });
    } else {
      const input = (await request.json()) as Record<string, unknown> & { accountType?: "user" | "organization" };
      const { accountType: type, ...rest } = input;
      accountType = type || null;
      payload = rest;
    }

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

    const ref = (payload.referralCode as string | undefined || payload.ref as string | undefined)?.trim() || "";
    delete payload.referralCode;
    delete payload.ref;

    // Clean up empty strings, null, and undefined values from payload to prevent backend validation issues
    for (const key in payload) {
      if (payload[key] === "" || payload[key] === null || payload[key] === undefined) {
        delete payload[key];
      }
    }

    const refParam = ref ? `?ref=${encodeURIComponent(ref)}` : "";
    const endpoint = accountType === "organization" ? "/api/v1/auth/register/organization" : `/api/v1/auth/register${refParam}`;
    
    const fd = new FormData();
    fd.append("request", new Blob([JSON.stringify(payload)], { type: "application/json" }));

    if (accountType === "user") {
      if (profilePhoto && profilePhoto.size > 0) fd.append("profilePhoto", profilePhoto);
      if (banner && banner.size > 0) fd.append("banner", banner);
    } else {
      if (logo && logo.size > 0) fd.append("logo", logo);
      if (banner && banner.size > 0) fd.append("banner", banner);
    }

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
    console.error("Registration proxy error:", error);
    return NextResponse.json(
      { message: "The authentication service is unavailable. Make sure the Spring Boot backend is running on port 5050." },
      { status: 503 },
    );
  }
}
