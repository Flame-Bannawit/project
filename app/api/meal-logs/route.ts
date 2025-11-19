import { NextResponse } from "next/server";
import { MealLog } from "@/models/MealLog";    // ✅ แก้ตรงนี้
import { connectDB } from "@/lib/mongoose";

export async function GET() {
  try {
    await connectDB();
    const logs = await MealLog.find().sort({ createdAt: -1 });
    return NextResponse.json(logs);
  } catch (err) {
    console.error("Meal Log Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
