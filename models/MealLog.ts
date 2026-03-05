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

    // ข้อมูลสารอาหารปัจจุบัน (ค่าที่เปลี่ยนแปลงตามการ Edit)
    calories: Number,
    totalCalories: Number,
    protein: Number,
    fat: Number,
    carbs: Number,
    portion: Number,

    // 🆕 เพิ่มเปอร์เซ็นต์ที่เหลือ (0 = กินหมด, 100 = ไม่กินเลย)
    remainingPercent: { type: Number, default: 0 },

    // ผลจาก AI และ Mapping
    aiLabel: String,
    thaiDish: {
      id: String,
      thaiName: String,
      baseCalories: Number,
      protein: Number,
      fat: Number,
      carbs: Number,
      healthNote: String,
      
      // 🆕 ฟิลด์เก็บค่าต้นฉบับ 100% จาก AI (ห้ามแก้ไขฟิลด์เหล่านี้หลังบันทึก)
      originalCalories: Number,
      originalProtein: Number,
      originalFat: Number,
      originalCarbs: Number,
    },

    thaiDishId: String,
    loggedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const MealLog =
  mongoose.models.MealLog || mongoose.model("MealLog", MealLogSchema);