// app/api/analyze-food/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { MealLog } from "@/models/MealLog";

import { mapLogMealToThaiDish } from "@/lib/mapLogMealToThai";

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

    //
    // 1) ดาวน์โหลดรูปจาก Cloudinary
    //
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      return NextResponse.json(
        { error: "Cannot download image from URL" },
        { status: 500 }
      );
    }
    const imgBlob = await imgRes.blob();

    //
    // 2) ส่งภาพให้ LogMeal
    //
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

    //
    // 3) Top 3 ผลจาก LogMeal
    //
    let topResults: { name: string; prob: number }[] = [];
    if (Array.isArray(raw.recognition_results)) {
      topResults = raw.recognition_results
        .slice(0, 3)
        .map((item: any) => ({
          name: item.name,
          prob: item.prob,
        }));
    }

    const top1 = topResults[0];

    //
    // 4) แมปเมนูไทย (อันใหม่)
    //
    const thaiDishMatch = mapLogMealToThaiDish(raw); // <- ใช้ฟังก์ชันที่เราสร้าง

    const thaiDish = thaiDishMatch
      ? {
          id: thaiDishMatch.dish.id,
          thaiName: thaiDishMatch.dish.thaiName,
          baseCalories: thaiDishMatch.dish.baseCalories,
          protein: thaiDishMatch.dish.protein,
          fat: thaiDishMatch.dish.fat,
          carbs: thaiDishMatch.dish.carbs,
          matchedName: thaiDishMatch.matchedName,
          matchedKeyword: thaiDishMatch.matchedKeyword,
          confidence: thaiDishMatch.confidence,
        }
      : null;

    //
    // 5) บันทึกลง MealLog
    //
    const logDoc = await MealLog.create({
      imageUrl,
      aiLabel: top1?.name,
      aiProb: top1?.prob,
      thaiDish,   // <<--- บันทึกผลเมนูไทยลง DB ด้วย
      raw,
    });

    //
    // 6) ส่งกลับไปหน้าเว็บ
    //
    return NextResponse.json({
      logId: logDoc._id.toString(),
      topResults,
      thaiDish,       // 👈 สิ่งที่หน้าเว็บต้องเอาไปใช้งาน
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
