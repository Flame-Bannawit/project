import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { MealLog } from "@/models/MealLog";
import getCurrentUser from "@/lib/auth";
import { GoogleGenAI } from "@google/genai";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    console.log("--- 🚀 API Analyze Multi-Food Started ---");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Missing API Key" }, { status: 500 });

    const authUser = await getCurrentUser() as any;
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let base64Image = "";
    let fileType = "image/jpeg";
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("image") as File;
      if (!file) return NextResponse.json({ error: "ไม่พบไฟล์รูปภาพ" }, { status: 400 });
      
      fileType = file.type;
      const arrayBuffer = await file.arrayBuffer();
      base64Image = Buffer.from(arrayBuffer).toString("base64");
    }

    if (!base64Image) return NextResponse.json({ error: "ไม่มีข้อมูลรูปภาพ" }, { status: 400 });

    console.log("Uploading to Cloudinary...");
    const uploadRes = await cloudinary.uploader.upload(`data:${fileType};base64,${base64Image}`, {
      folder: "healthy_mate_meals",
    });

    await connectDB();
    const ai = new GoogleGenAI({ apiKey });

    // 🎯 แก้ไข Prompt: ย้ำให้ AI คำนวณเลขจริงๆ และใช้ตัวอย่างที่เป็นตัวเลขไม่ใช่ 0
    console.log("Calling Gemini 2.5 Flash...");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [
          { text: `วิเคราะห์ภาพอาหารนี้ หากมีอาหารหลายอย่างในภาพ ให้แยกออกมาเป็นรายการๆ (สูงสุด 5 รายการที่เด่นที่สุด) 
          โปรดประเมินค่า แคลอรี่ (Kcal), โปรตีน (g), คาร์บ (g), ไขมัน (g) ของแต่ละรายการอย่างแม่นยำตามความเป็นจริง (ห้ามตอบ 0 เด็ดขาด)
          และตอบกลับมาเป็น JSON Array รูปแบบนี้เท่านั้น:
          [
            { "thaiName": "ชื่ออาหาร 1", "baseCalories": 350, "protein": 20, "fat": 15, "carbs": 40, "healthNote": "คำแนะนำ" },
            { "thaiName": "ชื่ออาหาร 2", "baseCalories": 120, "protein": 5, "fat": 2, "carbs": 20, "healthNote": "คำแนะนำ" }
          ]
          ห้ามมีข้อความอื่นปนเด็ดขาด` },
          { inlineData: { data: base64Image, mimeType: fileType } }
        ]
      }]
    });

    const responseText = response.text;
    if (!responseText) throw new Error("AI did not return any data");

    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    let aiDataArray = [];
    try {
      aiDataArray = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
      if (!Array.isArray(aiDataArray)) {
        aiDataArray = [aiDataArray];
      }
    } catch (e) {
      console.error("JSON Parse Error:", responseText);
      throw new Error("AI data format invalid");
    }

    const savedResults = [];

    for (const aiData of aiDataArray) {
      // 🛡️ ป้องกัน AI ดื้อส่งมาเป็น String โดยใช้ Number() คลุมไว้อีกชั้น
      const parsedCal = Number(aiData.baseCalories) || Number(aiData.calories) || 0;
      const parsedPro = Number(aiData.protein) || 0;
      const parsedFat = Number(aiData.fat) || 0;
      const parsedCarb = Number(aiData.carbs) || 0;

      const logDoc = await MealLog.create({
        userId: authUser._id || authUser.id,
        imageUrl: uploadRes.secure_url,
        isSaved: false, 
        aiLabel: aiData.thaiName,
        foodName: aiData.thaiName,
        thaiName: aiData.thaiName,
        calories: parsedCal,
        totalCalories: parsedCal,
        protein: parsedPro,
        fat: parsedFat,
        carbs: parsedCarb,
        portion: 1,
        thaiDish: {
          ...aiData,
          originalCalories: parsedCal,
          originalProtein: parsedPro,
          originalFat: parsedFat,
          originalCarbs: parsedCarb,
        }
      });

      savedResults.push({
        logId: logDoc._id.toString(),
        thaiDish: logDoc.thaiDish,
        imageUrl: uploadRes.secure_url
      });
    }

    console.log(`✅ Analysis success: Found ${savedResults.length} items`);

    return NextResponse.json({
      success: true,
      results: savedResults
    });

  } catch (err: any) {
    console.error("--- ❌ API Error ---", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}