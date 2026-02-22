import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          await connectDB();
          
          if (!credentials?.email || !credentials?.password) {
            throw new Error("กรุณากรอกอีเมลและรหัสผ่าน");
          }

          const user = await User.findOne({ email: credentials.email });
          if (!user) {
            throw new Error("ไม่พบผู้ใช้งานในระบบ");
          }

          const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password);
          if (!isPasswordCorrect) {
            throw new Error("รหัสผ่านไม่ถูกต้อง");
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
          };
        } catch (error: any) {
          console.error("Auth Error:", error.message);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 วัน
  },
  pages: {
    signIn: "/login",
    error: "/login", // ✅ เพิ่มบรรทัดนี้เพื่อป้องกันหน้าขาวเวลา Error
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.email = user.email; // ✅ เก็บ Email ไว้ใน Token เพื่อใช้ตรวจสอบ Role
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
      }
      return session;
    },
    // ✅ เพิ่มส่วนนี้เพื่อคุมการ Redirect หลัง Login ทันที
    async redirect({ url, baseUrl }: { url: string, baseUrl: string }) {
      // ถ้า Login สำเร็จ ปกติ NextAuth จะพาไปที่ url ที่ระบุไว้ใน callbackUrl
      // หรือถ้าไม่มีจะพาไป baseUrl (หน้า Home)
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };