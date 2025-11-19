import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

export type AuthTokenPayload = {
  _id: string;
  email: string;
};

// สร้าง JWT (ใช้ตอน register / login)
export function signToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// อ่าน token จาก cookie (ใช้ใน API)
export default async function getCurrentUser(): Promise<AuthTokenPayload | null> {
  const cookieStore = await cookies(); // ต้อง await
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    return decoded;
  } catch (err) {
    return null;
  }
}
