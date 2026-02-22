// app/api/meal-logs/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { MealLog } from "@/models/MealLog";
import getCurrentUser from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ✅ กำหนดเป็น Promise
) {
  try {
    // 1. ตรวจสอบสิทธิ์
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ 2. ต้อง await params ก่อนนำค่า id มาใช้ (Next.js 15+ บังคับ)
    const { id } = await params;

    await connectDB();
    
    // 3. ลบรายการโดยเช็คทั้ง ID และเจ้าของ
    const deletedLog = await MealLog.findOneAndDelete({
      _id: id,
      userId: authUser._id,
    });

    if (!deletedLog) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลหรือคุณไม่มีสิทธิ์ลบรายการนี้" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: "ลบรายการอาหารเรียบร้อยแล้ว" 
    });
  } catch (err: any) {
    console.error("DELETE ERROR:", err.message);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบข้อมูล" },
      { status: 500 }
    );
  }
}