// lib/health.ts

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type Gender = "male" | "female" | "other";

export function calcAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function calcBMI(weightKg: number, heightCm: number): number {
  const hM = heightCm / 100;
  if (!hM) return 0;
  return weightKg / (hM * hM);
}

// BMR: ใช้ Mifflin-St Jeor
export function calcBMR(
  gender: Gender,
  weightKg: number,
  heightCm: number,
  age: number
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === "female") return base - 161;
  // male + other ใช้สูตรผู้ชาย
  return base + 5;
}

export function activityMultiplier(level: ActivityLevel): number {
  switch (level) {
    case "sedentary":
      return 1.2;
    case "light":
      return 1.375;
    case "moderate":
      return 1.55;
    case "active":
      return 1.725;
    case "very_active":
      return 1.9;
    default:
      return 1.55;
  }
}

export function calcTDEE(
  bmr: number,
  level: ActivityLevel = "moderate"
): number {
  return bmr * activityMultiplier(level);
}

export function buildHealthSummary(opts: {
  gender: Gender;
  birthDate: Date;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
}) {
  const age = calcAge(opts.birthDate);
  const bmi = calcBMI(opts.weightKg, opts.heightCm);
  const bmr = calcBMR(opts.gender, opts.weightKg, opts.heightCm, age);
  const tdee = calcTDEE(bmr, opts.activityLevel);

  return {
    age,
    bmi,
    bmr,
    tdee,
  };
}
