import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in .env.local");
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) {
    // ตรวจสอบว่า Connection ยังใช้งานได้จริง (readyState 1 = connected)
    if (mongoose.connection.readyState === 1) {
      return cached.conn;
    }
    // ถ้าสถานะไม่ใช่ connected ให้ล้างค่า cache เพื่อต่อใหม่
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // ปิดการรอคำสั่งจนกว่าจะต่อติด (ป้องกันอาการค้าง)
      maxPoolSize: 10,       // จำกัดจำนวน connection
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("✅ MongoDB Connected Successfully");
      return mongoose;
    }).catch((e) => {
      cached.promise = null; // ล้าง promise ถ้าต่อไม่ติด เพื่อให้ลองใหม่ได้
      console.error("❌ MongoDB Connection Error:", e);
      throw e;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}