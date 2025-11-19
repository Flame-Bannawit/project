import { NextRequest, NextResponse } from "next/server";
import getCurrentUser from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import { buildHealthSummary } from "@/lib/health";

// GET: ดึงข้อมูลโปรไฟล์ + summary สุขภาพ
export async function GET() {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const user = await User.findById(authUser._id);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const health = buildHealthSummary({
    gender: user.gender,
    birthDate: user.birthDate,
    heightCm: user.heightCm,
    weightKg: user.weightKg,
    activityLevel: user.activityLevel,
  });

  return NextResponse.json({
    profile: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      gender: user.gender,
      birthDate: user.birthDate,
      heightCm: user.heightCm,
      weightKg: user.weightKg,
      activityLevel: user.activityLevel,
      health,
    },
  });
}

// PUT: อัปเดตโปรไฟล์ + คำนวณ summary ใหม่
export async function PUT(req: NextRequest) {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  await connectDB();
  const user = await User.findById(authUser._id);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (body.name) user.name = body.name;
  if (body.gender) user.gender = body.gender;
  if (body.birthDate) user.birthDate = new Date(body.birthDate);
  if (body.heightCm) user.heightCm = body.heightCm;
  if (body.weightKg) user.weightKg = body.weightKg;
  if (body.activityLevel) user.activityLevel = body.activityLevel;

  await user.save();

  const health = buildHealthSummary({
    gender: user.gender,
    birthDate: user.birthDate,
    heightCm: user.heightCm,
    weightKg: user.weightKg,
    activityLevel: user.activityLevel,
  });

  return NextResponse.json({
    ok: true,
    profile: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      gender: user.gender,
      birthDate: user.birthDate,
      heightCm: user.heightCm,
      weightKg: user.weightKg,
      activityLevel: user.activityLevel,
      health,
    },
  });
}
