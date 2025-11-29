// lib/mapLogMealToThai.ts

import { THAI_DISHES, ThaiDish } from "./thaiMenu";

type LogMealRecognition = {
  name: string;
  prob?: number;
};

type LogMealResponse = {
  recognition_results?: LogMealRecognition[];
};

export type ThaiDishMatch = {
  dish: ThaiDish;
  matchedName: string;     // ชื่อที่ได้จาก LogMeal
  matchedKeyword: string;  // keyword ที่เราใช้จับคู่
  confidence: number;      // 0-1
};

function simpleSimilarity(a: string, b: string): number {
  const A = a.toLowerCase();
  const B = b.toLowerCase();
  if (!A || !B) return 0;

  if (A === B) return 1;
  if (A.includes(B) || B.includes(A)) return 0.8;

  const aWords = A.split(/[\s,_-]+/);
  const bWords = B.split(/[\s,_-]+/);
  const common = aWords.filter((w) => bWords.includes(w));
  if (common.length > 0) return 0.5;

  return 0;
}

export function mapLogMealToThaiDish(
  raw: LogMealResponse
): ThaiDishMatch | null {
  const recs = raw.recognition_results || [];
  if (recs.length === 0) return null;

  let best: ThaiDishMatch | null = null;

  for (const r of recs) {
    const name = r.name || "";
    const prob = r.prob ?? 0;

    for (const dish of THAI_DISHES) {
      for (const kw of dish.engKeywords) {
        const sim = simpleSimilarity(name, kw);
        // ผสม sim กับ prob ของ LogMeal เพื่อได้คะแนนรวมแบบหยาบๆ
        const score = sim * (0.5 + prob * 0.5);

        if (!best || score > best.confidence) {
          best = {
            dish,
            matchedName: name,
            matchedKeyword: kw,
            confidence: score,
          };
        }
      }
    }
  }

  // ถ้าความมั่นใจต่ำกว่า 0.35 => ยังไม่กล้าฟันธงว่าเป็นเมนูไทยไหน
  if (!best || best.confidence < 0.35) {
    return null;
  }

  return best;
}
