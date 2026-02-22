// app/api/analyze-food/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { MealLog } from "@/models/MealLog";
import getCurrentUser from "@/lib/auth"; // ✅ เพิ่มตัวดึงข้อมูล User
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenAI({ apiKey: apiKey });

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: "กรุณาตั้งค่า GEMINI_API_KEY" }, { status: 500 });
    }

    // ✅ 1. ตรวจสอบว่าใครเป็นคนวิเคราะห์
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return NextResponse.json({ error: "ไม่พบ URL ของรูปภาพ" }, { status: 400 });
    }

    await connectDB();

    // ดาวน์โหลดรูปและแปลงเป็น Base64
    const imgRes = await fetch(imageUrl);
    const arrayBuffer = await imgRes.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");

    // 2. วิเคราะห์ด้วย Gemini
    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        role: "user",
        parts: [
          { text: "วิเคราะห์ภาพอาหารนี้และตอบเป็น JSON ภาษาไทยเท่านั้น: { \"thaiName\": \"\", \"baseCalories\": 0, \"protein\": 0, \"fat\": 0, \"carbs\": 0, \"healthNote\": \"\" }" },
          { inlineData: { data: base64Image, mimeType: "image/jpeg" } }
        ]
      }]
    });

    const responseText = response.text || ""; 
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      return NextResponse.json({ error: "AI ไม่ส่งข้อมูล JSON กลับมา" }, { status: 500 });
    }
    
    const aiData = JSON.parse(jsonMatch[0]);

    // ✅ 3. บันทึกลงฐานข้อมูลพร้อม userId
    const logDoc = await MealLog.create({
      userId: authUser._id, // 🔥 ผูกเจ้าของข้อมูลตรงนี้
      imageUrl,
      aiLabel: aiData.thaiName,
      thaiDish: {
        thaiName: aiData.thaiName,
        baseCalories: aiData.baseCalories || 0,
        protein: aiData.protein || 0,
        fat: aiData.fat || 0,
        carbs: aiData.carbs || 0,
        healthNote: aiData.healthNote || ""
      }
    });

    return NextResponse.json({
      success: true,
      logId: logDoc._id.toString(),
      thaiDish: logDoc.thaiDish
    });

  } catch (err: any) {
    console.error("Analyze API Error:", err.message);
    return NextResponse.json({ error: err.message || "Server Error" }, { status: 500 });
  }
}