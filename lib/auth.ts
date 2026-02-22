// lib/auth.ts
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongoose";
import User, { IUser } from "@/models/User"; // ✅ มั่นใจว่า path และ export ถูก

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

export type AuthTokenPayload = {
  _id: string;
  email: string;
};

// สร้าง JWT
export function signToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// ✅ อ่านข้อมูลผู้ใช้ปัจจุบันจาก Database
export default async function getCurrentUser(): Promise<IUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      console.log("DEBUG: No token found in cookies");
      return null;
    }

    // 1. ถอดรหัส Token
    const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    if (!decoded._id) return null;

    // 2. เชื่อมต่อ DB และหา User
    await connectDB();
    const user = await User.findById(decoded._id).select("-password");

    if (!user) {
      console.log("DEBUG: User not found in DB for ID:", decoded._id);
      return null;
    }

    // ✅ คืนค่าเป็น IUser (ซึ่งมี role แน่นอน)
    return user as IUser;
  } catch (err) {
    console.error("DEBUG: Auth Error:", err);
    return null;
  }
}