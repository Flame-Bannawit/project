import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { MealLog } from "@/models/MealLog";
import getCurrentUser from "@/lib/auth";
import { GoogleGenAI } from "@google/genai";
import { v2 as cloudinary } from "cloudinary"; // 🟢 1. Import Cloudinary

// 🟢 2. ตั้งค่า Cloudinary ด้วย Key ที่มีใน .env.local ของคุณ
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    console.log("--- 🚀 API Analyze Food Started ---");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Missing API Key" }, { status: 500 });

    const authUser = await getCurrentUser();
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

    // 🟢 3. อัปโหลดรูปไปที่ Cloudinary ก่อนเพื่อให้ได้ URL จริง
    console.log("Uploading to Cloudinary...");
    const uploadRes = await cloudinary.uploader.upload(`data:${fileType};base64,${base64Image}`, {
      folder: "healthy_mate_meals", // ชื่อโฟลเดอร์ใน Cloudinary
    });

    await connectDB();
    const ai = new GoogleGenAI({ apiKey });

    // 🎯 4. เรียกใช้ Gemini 2.5 Flash
    console.log("Calling Gemini 2.5 Flash...");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [
          { text: "วิเคราะห์ภาพอาหารนี้และตอบเป็น JSON ภาษาไทยเท่านั้น: { \"thaiName\": \"\", \"baseCalories\": 0, \"protein\": 0, \"fat\": 0, \"carbs\": 0, \"healthNote\": \"\" } ห้ามมีข้อความอื่นปน" },
          { inlineData: { data: base64Image, mimeType: fileType } }
        ]
      }]
    });

    const responseText = response.text;
    if (!responseText) throw new Error("AI did not return any data");

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const aiData = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);

    // 🟢 5. บันทึกลงฐานข้อมูล (ใช้ URL จาก Cloudinary แล้ว!)
    const logDoc = await MealLog.create({
      userId: authUser._id,
      imageUrl: uploadRes.secure_url, // ✅ เปลี่ยนจาก placeholder เป็น URL จริง
      aiLabel: aiData.thaiName,
      foodName: aiData.thaiName,
      calories: aiData.baseCalories || 0,
      protein: aiData.protein || 0,
      fat: aiData.fat || 0,
      carbs: aiData.carbs || 0,
      thaiDish: {
        ...aiData,
        originalCalories: aiData.baseCalories || 0
      }
    });

    console.log("✅ Analysis success & Image saved:", aiData.thaiName);

    return NextResponse.json({
      success: true,
      logId: logDoc._id.toString(),
      thaiDish: logDoc.thaiDish,
      imageUrl: uploadRes.secure_url // ส่งกลับไปให้หน้าบ้านเผื่อใช้งาน
    });

  } catch (err: any) {
    console.error("--- ❌ API Error ---", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}