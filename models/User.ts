// models/User.ts
import mongoose, { Schema, model, models, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  gender: 'male' | 'female';
  birthDate: Date;
  heightCm: number;
  weightKg: number;
  activityLevel: number; 
  role: 'user' | 'admin';
  dailyCalorieGoal: number;
  proteinGoal: number;
  fatGoal: number;
  carbsGoal: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    gender: { type: String, enum: ['male', 'female'], required: true },
    birthDate: { type: Date, required: true },
    heightCm: { type: Number, required: true },
    weightKg: { type: Number, required: true },
    activityLevel: { type: Number, required: true, default: 1.2 },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    dailyCalorieGoal: { type: Number, default: 2000 },
    proteinGoal: { type: Number, default: 0 },
    fatGoal: { type: Number, default: 0 },
    carbsGoal: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ✅ เพิ่ม Middleware คำนวณอัตโนมัติก่อนบันทึก (Pre-save Hook)
UserSchema.pre("save", function (next) {
  // คำนวณอายุจาก birthDate
  const today = new Date();
  const birth = new Date(this.birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  // 1. สูตร Mifflin-St Jeor เพื่อหา BMR
  let bmr = 0;
  if (this.gender === "male") {
    bmr = 10 * this.weightKg + 6.25 * this.heightCm - 5 * age + 5;
  } else {
    bmr = 10 * this.weightKg + 6.25 * this.heightCm - 5 * age - 161;
  }

  // 2. คำนวณ TDEE (Daily Calorie Goal)
  // bmr * activityLevel (เช่น 1.2, 1.375, 1.55)
  const tdee = Math.round(bmr * this.activityLevel);
  this.dailyCalorieGoal = tdee;

  // 3. คำนวณสารอาหารหลัก (Macros) - สัดส่วนมาตรฐาน 40/30/30
  // Protein (30%): 1g = 4kcal
  this.proteinGoal = Math.round((tdee * 0.30) / 4);
  // Fat (30%): 1g = 9kcal
  this.fatGoal = Math.round((tdee * 0.30) / 9);
  // Carbs (40%): 1g = 4kcal
  this.carbsGoal = Math.round((tdee * 0.40) / 4);

  next();
});

const User = models.User || model<IUser>("User", UserSchema);
export default User;