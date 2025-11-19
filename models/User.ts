// models/User.ts
import mongoose, { Schema, model, models, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  gender: string;
  birthDate: Date;
  heightCm: number;
  weightKg: number;
  activityLevel: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    gender: { type: String, required: true },
    birthDate: { type: Date, required: true },
    heightCm: { type: Number, required: true },
    weightKg: { type: Number, required: true },
    activityLevel: { type: Number, required: true },
  },
  { timestamps: true }
);

const User = models.User || model<IUser>("User", UserSchema);

export default User;
export type { User };
