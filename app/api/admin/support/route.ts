import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
// ✅ แก้ไขบรรทัดนี้: ตรวจสอบว่าชื่อไฟล์ในโฟลเดอร์ models ของคุณสะกดอย่างไร (Feedback หรือ Feedback.ts)
import Feedback from "@/models/Feedback"; 
import getCurrentUser from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const adminUser = (await getCurrentUser()) as any;
    
    // 🛡️ ตรวจสอบสิทธิ์ Admin (อ้างอิงจาก User Profile ของคุณที่ใช้เมล useradmin@test.com)
    const isAdmin = adminUser?.role === "admin" || adminUser?.email === "useradmin@test.com";
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    await connectDB();
    // 🔍 ดึงข้อมูลแจ้งปัญหาทั้งหมด เรียงจากล่าสุด
    const reports = await Feedback.find()
    .populate('userId', 'name email')
    .sort({ createdAt: -1 });
    return NextResponse.json(reports);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 📝 สำหรับเปลี่ยนสถานะ (เช่น จาก Pending เป็น Resolved)
export async function PATCH(req: Request) {
    try {
      const adminUser = (await getCurrentUser()) as any;
      if (adminUser?.role !== "admin" && adminUser?.email !== "useradmin@test.com") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      const { id, status } = await req.json();
      await connectDB();
      const updated = await Feedback.findByIdAndUpdate(id, { status }, { new: true });
      
      if (!updated) {
        return NextResponse.json({ error: "Report not found" }, { status: 404 });
      }

      return NextResponse.json(updated);
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
}