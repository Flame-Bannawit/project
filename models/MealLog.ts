// models/MealLog.ts
import { Schema, model, models } from "mongoose";

const MealLogSchema = new Schema(
  {
    // ภายหลังจะมี userId จริง ตอนนี้ mock ไปก่อน
    userId: { type: String, default: "demo-user" },

    imageUrl: { type: String, required: true },

    // label ที่ AI ทำนายอันดับ 1
    aiLabel: { type: String },
    aiProb: { type: Number },

    // เผื่อไว้ map กับเมนูใน DB (ไทย)
    menuId: { type: Schema.Types.ObjectId, ref: "Menu" },

    // สำรอง raw บางส่วนไว้ debug
    raw: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const MealLog = models.MealLog || model("MealLog", MealLogSchema);
