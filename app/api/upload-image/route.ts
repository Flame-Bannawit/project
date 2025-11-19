import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("image") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No image" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const dataURI = `data:${file.type};base64,${base64}`;

  const result = await cloudinary.uploader.upload(dataURI, {
    folder: "healthy-food-ai",
  });

  return NextResponse.json({ url: result.secure_url });
}
