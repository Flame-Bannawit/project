// app/api/analyze-food/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { MealLog } from "@/models/MealLog";

export async function POST(req: NextRequest) {
  console.log("Has LOGMEAL_API_KEY?", !!process.env.LOGMEAL_API_KEY);

  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "imageUrl required" },
        { status: 400 }
      );
    }

    await connectDB();

    // 1) ดาวน์โหลดรูปจาก Cloudinary
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      return NextResponse.json(
        { error: "Cannot download image from URL" },
        { status: 500 }
      );
    }
    const imgBlob = await imgRes.blob();

    // 2) ส่งให้ LogMeal
    const formData = new FormData();
    formData.append("image", imgBlob, "food.jpg");

    const logmealRes = await fetch(
      "https://api.logmeal.es/v2/image/recognition/complete",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.LOGMEAL_API_KEY}`,
        },
        body: formData,
      }
    );

    const raw = await logmealRes.json();

    if (!logmealRes.ok) {
      return NextResponse.json(
        { error: "LogMeal error", raw },
        { status: 500 }
      );
    }

    // 3) จัด Top 3
    let topResults: { name: string; prob: number }[] = [];
    if (Array.isArray(raw.recognition_results)) {
      topResults = raw.recognition_results.slice(0, 3).map((item: any) => ({
        name: item.name,
        prob: item.prob,
      }));
    }

    // 4) บันทึกลง MealLog (ใช้ Top 1 เป็นค่า default)
    const top1 = topResults[0];

    const logDoc = await MealLog.create({
      imageUrl,
      aiLabel: top1?.name,
      aiProb: top1?.prob,
      raw,
    });

    // 5) ส่งกลับไปให้หน้า Analyze
    return NextResponse.json({
      logId: logDoc._id.toString(),
      topResults,
      imageId: raw.imageId,
      foodType: raw.foodType,
      occasion: raw.occasion,
    });
  } catch (err) {
    console.error("analyze-food ERROR:", err);
    return NextResponse.json(
      { error: "Failed to analyze image" },
      { status: 500 }
    );
  }
}
