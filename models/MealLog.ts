import mongoose from "mongoose";

const MealLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    imageUrl: { type: String, required: true },
    
    // ข้อมูลชื่ออาหารสำหรับแสดงผลหน้าประวัติ
    foodName: String, 
    thaiName: String,

    // ข้อมูลสารอาหาร (หลังคำนวณ Portion)
    calories: Number,      // ใช้ฟิลด์นี้เป็นหลัก
    totalCalories: Number, // เพิ่มตัวนี้เข้าไปเพื่อให้ตรงกับหน้า History
    protein: Number,
    fat: Number,
    carbs: Number,
    portion: Number,

    // ผลจาก AI และ Mapping
    aiLabel: String,
    thaiDish: {
      id: String,
      thaiName: String,
      baseCalories: Number,
      protein: Number,
      fat: Number,
      carbs: Number,
      healthNote: String, // เพิ่มเพื่อให้เก็บ Note จาก AI ได้
    },

    thaiDishId: String,
    loggedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const MealLog =
  mongoose.models.MealLog || mongoose.model("MealLog", MealLogSchema);