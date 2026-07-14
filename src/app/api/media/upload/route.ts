import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { ACCESS_COOKIE } from "@/lib/server-auth";

export const runtime = "nodejs";
type UploadResult = { secure_url: string; public_id: string; resource_type: string };

export async function POST(request: NextRequest) {
  if (!request.cookies.get(ACCESS_COOKIE)?.value) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ message: "Cloudinary is not configured yet." }, { status: 503 });
  }
  const form = await request.formData();
  const file = form.get("file");
  const folder = String(form.get("folder") || "ween/media").replace(/[^a-zA-Z0-9/_-]/g, "");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ message: "Choose an image or video to upload." }, { status: 400 });
  }
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ message: "Media must be smaller than 20 MB." }, { status: 413 });
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  const result = await new Promise<UploadResult>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto", transformation: file.type.startsWith("image/") ? [{ quality: "auto", fetch_format: "auto" }] : undefined },
      (error, upload) => error || !upload ? reject(error || new Error("Upload failed")) : resolve(upload as UploadResult),
    );
    stream.end(bytes);
  });
  return NextResponse.json({ url: result.secure_url, publicId: result.public_id, resourceType: result.resource_type });
}
