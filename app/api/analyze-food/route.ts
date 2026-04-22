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

// 🆕 ฟังก์ชัน Helper: Retry + Fallback Model (พร้อมส่งชื่อโมเดลที่ใช้กลับไป)
const generateWithRetry = async (ai: any, contents: any, maxRetries = 3) => {
  let retries = 0;
  let delay = 2000; // เริ่มต้นรอที่ 2 วินาที

  while (true) {
    try {
      // 🥇 แผน A: พยายามเรียกใช้โมเดลหลัก (Gemini 2.5 Flash)
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents
      });
      return { response, modelUsed: "gemini-2.5-flash" }; // คืนค่าตัวที่ใช้งานสำเร็จ
      
    } catch (error: any) {
      const isBusy = error?.status === "UNAVAILABLE" || error?.code === 503 || error?.message?.includes("503") || error?.message?.includes("high demand");
      
      if (isBusy && retries < maxRetries) {
        retries++;
        console.log(`⚠️ Gemini 2.5 Busy (503). Retrying... (${retries}/${maxRetries}) in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; 
      } else {
        // 🥈 แผน B: ถ้า 2.5 พังครบ 3 รอบ ให้สลับมาใช้ 1.5 Flash
        if (isBusy) {
          console.log("🔄 Gemini 2.5 is completely down. Switching to fallback model: gemini-1.5-flash...");
          try {
            const fallbackResponse = await ai.models.generateContent({
              model: "gemini-1.5-flash",
              contents: contents
            });
            return { response: fallbackResponse, modelUsed: "gemini-1.5-flash" }; // คืนค่าตัวสำรองที่ใช้สำเร็จ
          } catch (fallbackError) {
            // ถ้า 1.5 ยังพังอีก แปลว่าล่มหนักมาก ให้เตะออก
            throw new Error("AI_BUSY");
          }
        }
        throw error; 
      }
    }
  }
};

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

    console.log("Calling Gemini AI (with Retry & Fallback Logic)...");
    
    const promptContents = [{
      role: "user",
      parts: [
        { text: `วิเคราะห์ภาพอาหารนี้ หากมีอาหารหลายอย่างในภาพ ให้แยกออกมาเป็นรายการๆ (สูงสุด 5 รายการที่เด่นที่สุด) 
        
        ⚠️ กฎเหล็กที่ต้องทำตามอย่างเคร่งครัด (CRITICAL RULES):
        1. ห้ามแยกส่วนผสม (DO NOT break down ingredients): หากในภาพคืออาหาร 1 เมนู (เช่น ยำหมูยอ, ข้าวผัด, ผัดไทย) ให้ตอบกลับมาเป็น 1 รายการเท่านั้น ห้ามแยก หมูยอ, หอมใหญ่, มะเขือเทศ, เส้น, หรือผัก ออกจากกันเด็ดขาด ให้รวมแคลอรี่และสารอาหารทั้งหมดเป็น 1 เมนู
        2. แยกจานอาหาร (Separate Dishes): ให้ตอบกลับมากกว่า 1 รายการ ก็ต่อเมื่อในภาพมีอาหารแยกจานกันชัดเจน (เช่น ข้าวสวย 1 จาน, ต้มยำ 1 ชาม, ไก่ทอด 1 จาน)
        3. ห้ามตอบ 0: ประเมินค่า แคลอรี่ (Kcal), โปรตีน (g), คาร์บ (g), ไขมัน (g) อย่างแม่นยำตามความเป็นจริง
        
        ตอบกลับมาเป็น JSON Array รูปแบบนี้เท่านั้น:
        [
          { "thaiName": "ชื่ออาหาร 1", "baseCalories": 350, "protein": 20, "fat": 15, "carbs": 40, "healthNote": "คำแนะนำ" },
          { "thaiName": "ชื่ออาหาร 2", "baseCalories": 120, "protein": 5, "fat": 2, "carbs": 20, "healthNote": "คำแนะนำ" }
        ]
        ห้ามมีข้อความอื่นปนเด็ดขาด` },
        { inlineData: { data: base64Image, mimeType: fileType } }
      ]
    }];

    // 🎯 รับค่า response และ modelUsed จากระบบ
    const { response, modelUsed } = await generateWithRetry(ai, promptContents);

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

    // 🎯 พิมพ์บอกใน Console ว่าวิเคราะห์ผ่านโมเดลไหน
    console.log(`✅ Analysis success (using ${modelUsed}): Found ${savedResults.length} items`);

    return NextResponse.json({
      success: true,
      modelUsed: modelUsed, // 🎯 ส่งกลับไปให้หน้าเว็บรู้ด้วยว่าใช้ AI รุ่นไหน
      results: savedResults
    });

  } catch (err: any) {
    console.error("--- ❌ API Error ---", err.message);
    
    if (err.message === "AI_BUSY") {
      return NextResponse.json({ error: "ระบบ AI ของ Google กำลังมีผู้ใช้งานหนาแน่น โปรดรอสักครู่แล้วกดสแกนใหม่อีกครั้ง" }, { status: 503 });
    }
    
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}