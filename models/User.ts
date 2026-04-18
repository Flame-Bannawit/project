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
  goal: 'weight_loss' | 'health_maintenance' | 'muscle_gain' | 'none';
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
    goal: { 
      type: String, 
      enum: ['weight_loss', 'health_maintenance', 'muscle_gain', 'none'], 
      default: 'none' 
    },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    dailyCalorieGoal: { type: Number, default: 2000 },
    proteinGoal: { type: Number, default: 0 },
    fatGoal: { type: Number, default: 0 },
    carbsGoal: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ✅ Middleware คำนวณแคลอรี่ตาม "เป้าหมาย (Goal)" อัตโนมัติ
UserSchema.pre("save", function (next) {
  const today = new Date();
  const birth = new Date(this.birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  // 1. Mifflin-St Jeor เพื่อหา BMR
  let bmr = 0;
  if (this.gender === "male") {
    bmr = 10 * this.weightKg + 6.25 * this.heightCm - 5 * age + 5;
  } else {
    bmr = 10 * this.weightKg + 6.25 * this.heightCm - 5 * age - 161;
  }

  // 2. คำนวณ TDEE เบื้องต้น
  let tdee = Math.round(bmr * this.activityLevel);

  // 🎯 ปรับ Calorie Goal ตามเป้าหมาย (Goal)
  if (this.goal === 'weight_loss') {
    tdee -= 500; // ลด 500 kcal เพื่อลดน้ำหนัก
  } else if (this.goal === 'muscle_gain') {
    tdee += 300; // เพิ่ม 300 kcal เพื่อสร้างกล้ามเนื้อ
  }

  this.dailyCalorieGoal = tdee;

  // 3. คำนวณสารอาหารหลัก (Macros) ตามเป้าหมาย
  if (this.goal === 'muscle_gain') {
    this.proteinGoal = Math.round((tdee * 0.35) / 4);
    this.fatGoal = Math.round((tdee * 0.25) / 9);
    this.carbsGoal = Math.round((tdee * 0.40) / 4);
  } else if (this.goal === 'weight_loss') {
    this.proteinGoal = Math.round((tdee * 0.40) / 4);
    this.fatGoal = Math.round((tdee * 0.25) / 9);
    this.carbsGoal = Math.round((tdee * 0.35) / 4);
  } else {
    this.proteinGoal = Math.round((tdee * 0.30) / 4);
    this.fatGoal = Math.round((tdee * 0.30) / 9);
    this.carbsGoal = Math.round((tdee * 0.40) / 4);
  }

  next();
});

const User = models.User || model<IUser>("User", UserSchema);
export default User;