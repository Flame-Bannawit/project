import mongoose from "mongoose";

const MealLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // ถ้าตอนนี้ยังไม่ได้ผูก user ทุกเคส ค่อยให้ required ทีหลังได้
    },

    imageUrl: { type: String, required: true },

    // ผลจาก AI เดิม
    aiLabel: String,
    aiProb: Number,
    raw: Object,

    // ผล mapping เมนูไทยดิบ ๆ เก็บไว้ทั้งก้อน
    thaiDish: {
      id: String,
      thaiName: String,
      baseCalories: Number,
      protein: Number,
      fat: Number,
      carbs: Number,
      matchedName: String,
      matchedKeyword: String,
      confidence: Number,
    },

    // ส่วนที่เกี่ยวกับการกินจริง (หลัง user ยืนยัน)
    thaiDishId: String,     // ซ้ำกับ thaiDish.id แต่เก็บไว้แยกสำหรับ query
    thaiName: String,       // ซ้ำ thaiDish.thaiName
    portion: Number,        // กี่จาน เช่น 0.5 / 1 / 1.5 / 2

    calories: Number,       // kcal หลังคูณ portion แล้ว
    protein: Number,        // g
    fat: Number,            // g
    carbs: Number,          // g

    loggedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const MealLog =
  mongoose.models.MealLog || mongoose.model("MealLog", MealLogSchema);
