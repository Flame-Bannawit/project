import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Feedback } from "@/models/Feedback";
import getCurrentUser from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // 1. ตรวจสอบสิทธิ์ User
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. รับข้อมูลจาก Body
    const { message } = await req.json();
    if (!message || message.trim().length < 5) {
      return NextResponse.json(
        { error: "กรุณาพิมพ์ข้อความอย่างน้อย 5 ตัวอักษร" },
        { status: 400 }
      );
    }

    // 3. เชื่อมต่อ DB และบันทึก
    await connectDB();
    const newFeedback = await Feedback.create({
      userId: authUser._id,
      message: message.trim(),
    });

    return NextResponse.json({
      success: true,
      message: "ส่งข้อความสำเร็จแล้ว ทีมงานจะรีบตรวจสอบให้ครับ",
      data: newFeedback,
    });
  } catch (err: any) {
    console.error("SUPPORT_API_ERROR:", err.message);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการส่งข้อมูล" },
      { status: 500 }
    );
  }
}

// 💡 แถม: สำหรับ Admin ดึงข้อมูลทั้งหมดไปโชว์ในหน้า Dashboard
export async function GET(req: NextRequest) {
  try {
    const authUser = await getCurrentUser();
    // ตรวจสอบว่าเป็น Admin หรือไม่ (ถ้าคุณมีฟิลด์ role ใน User Model)
    if (!authUser || authUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const feedbacks = await Feedback.find()
      .populate("userId", "name email") // ดึงข้อมูลชื่อ/อีเมล User มาด้วย
      .sort({ createdAt: -1 });

    return NextResponse.json(feedbacks);
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch feedbacks" }, { status: 500 });
  }
}