// models/Menu.ts
import { Schema, model, models } from "mongoose";

const MenuSchema = new Schema(
  {
    nameTh: { type: String, required: true },
    nameEn: { type: String, required: true },
    category: { type: String }, // rice, noodle, stir-fry, etc.
    kcal: { type: Number },
    protein: { type: Number },
    carb: { type: Number },
    fat: { type: Number },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

export const Menu = models.Menu || model("Menu", MenuSchema);
