// lib/thaiMenu.ts

export type ThaiDish = {
  id: string;
  thaiName: string;
  baseCalories: number; // kcal ต่อ 1 จาน
  protein: number;      // g ต่อ 1 จาน
  fat: number;          // g ต่อ 1 จาน
  carbs: number;        // g ต่อ 1 จาน
  engKeywords: string[]; // คำอังกฤษที่ LogMeal อาจทายออกมา
};

// ⚠️ ตัวเลขโภชนาการเป็นค่าประมาณจากเว็บโภชนาการไทย + ปรับให้กลมๆ
// ไว้ค่อยไป fine-tune

export const THAI_DISHES: ThaiDish[] = [
  {
    id: "krapao_chicken_rice",
    thaiName: "ข้าวราดผัดกระเพราไก่",
    // อิงจากข้าวกะเพราไก่+ไข่ดาว ~480 kcal แล้วหักไข่ออกเหลือประมาณนี้:contentReference[oaicite:0]{index=0}
    baseCalories: 430,
    protein: 20,
    fat: 12,
    carbs: 55,
    engKeywords: [
      "basil chicken with rice",
      "thai basil chicken",
      "stir fried chicken with basil",
      "chicken holy basil",
      "pad kra pao chicken",
      "pad krapow chicken",
      "stir fried minced chicken basil",
    ],
  },
  {
    id: "krapao_pork_rice",
    thaiName: "ข้าวราดผัดกระเพราหมู",
    // ใช้ข้อมูลใกล้เคียงจากข้าวกะเพราหมูสับ 370 kcal:contentReference[oaicite:1]{index=1}
    baseCalories: 370,
    protein: 14,
    fat: 9,
    carbs: 59,
    engKeywords: [
      "basil pork with rice",
      "thai basil pork",
      "stir fried pork with basil",
      "minced pork basil",
      "ground pork holy basil",
      "pad kra pao pork",
      "pad krapow pork",
    ],
  },
  {
    id: "fried_rice_pork",
    thaiName: "ข้าวผัดหมู",
    // จาก calforlife ~627 kcal:contentReference[oaicite:2]{index=2}
    baseCalories: 630,
    protein: 55,
    fat: 37,
    carbs: 15, // (ตรงนี้จากต้นทางคาร์บน้อยผิดปกติ ไว้ทีหลัง Flame ปรับได้)
    engKeywords: [
      "pork fried rice",
      "fried rice with pork",
      "thai fried rice pork",
      "fried rice minced pork",
      "fried rice sliced pork",
    ],
  },
  {
    id: "fried_rice_chicken",
    thaiName: "ข้าวผัดไก่",
    // จาก calforlife ~644 kcal:contentReference[oaicite:3]{index=3}
    baseCalories: 645,
    protein: 10,
    fat: 28,
    carbs: 87,
    engKeywords: [
      "chicken fried rice",
      "fried rice with chicken",
      "thai fried rice chicken",
      "stir fried rice chicken",
    ],
  },
  {
    id: "tom_yum_goong",
    thaiName: "ต้มยำกุ้ง",
    // ใช้ค่ากลางๆ จากหลายแหล่ง ~150 kcal/ถ้วย โปรตีน ~12g คาร์บ ~10g ไขมัน ~5g:contentReference[oaicite:4]{index=4}
    baseCalories: 150,
    protein: 12,
    fat: 5,
    carbs: 10,
    engKeywords: [
      "tom yum goong",
      "tom yum kung",
      "tom yum soup shrimp",
      "spicy shrimp soup",
      "thai tom yum shrimp",
    ],
  },
  {
    id: "som_tum",
    thaiName: "ส้มตำ",
    // ส้มตำถาดกลางๆ ~120 kcal:contentReference[oaicite:5]{index=5}
    baseCalories: 120,
    protein: 3,
    fat: 2,
    carbs: 25,
    engKeywords: [
      "som tum",
      "thai papaya salad", 
      "spicy papaya salad",
      "green papaya salad",
      "thai som tum",
    ],
  },
  {
    id: "pad_thai",
    thaiName: "ผัดไทย",
    // ผัดไทยธรรมดาๆ ~400 kcal:contentReference[oaicite:6]{index=6}
    baseCalories: 400,
    protein: 15,
    fat: 18,
    carbs: 50,
    engKeywords: [
      "pad thai",
      "thai pad thai",
      "stir fried thai noodles",
      "thai stir fried noodles",
      "pad thai noodles",
    ],
  },
  {
    id: "green cury chicken",
    thaiName: "แกงเขียวหวานไก่",
    // แกงเขียวหวานไก่+ข้าวสวย ~500 kcal:contentReference[oaicite:7]{index=7}
    baseCalories: 500,
    protein: 25,
    fat: 22,
    carbs: 55,
    engKeywords: [
      "green curry chicken",
      "thai green curry",
      "green curry with chicken",
      "thai green curry chicken",
      "green curry chicken rice",
    ],
  },
  {
    id: "massaman_curry_beef",
    thaiName: "มัสมั่นเนื้อ",
    // มัสมั่นเนื้อ+ข้าวสวย ~600 kcal:contentReference[oaicite:8]{index=8}
    baseCalories: 600,
    protein: 30,
    fat: 25,
    carbs: 65,
    engKeywords: [
      "massaman curry beef",
      "thai massaman curry",
      "massaman curry with beef",
      "thai massaman curry beef",
      "massaman beef curry rice",
    ],
  },
  {
    id: "khao_soi_chicken",
    thaiName: "ข้าวซอยไก่",
    // ข้าวซอยไก่ชามกลาง ~550 kcal:contentReference[oaicite:9]{index=9}
    baseCalories: 550,
    protein: 20,
    fat: 30,
    carbs: 50,
    engKeywords: [
      "khao soi chicken",
      "thai khao soi",
      "khao soi with chicken",
      "thai khao soi chicken",
      "northern thai curry noodle soup",
    ],
  },
  {
    id: "pad_krapow_moo_kai_dao",
    thaiName: "ผัดกะเพราหมูไข่ดาว",
    // ข้าวราดกะเพราหมู+ไข่ดาว ~500 kcal:contentReference[oaicite:10]{index=10}
    baseCalories: 500,
    protein: 18,
    fat: 20,
    carbs: 55,
    engKeywords: [
      "pad krapow moo kai dao",
      "stir fried basil pork with fried egg",
      "basil pork with fried egg",
      "thai basil pork fried egg",
      "krapow pork fried egg",
    ],
  },
  {
    id: "moo_ping",
    thaiName: "หมูปิ้ง",
    // หมูปิ้งไม้กลางๆ 1 ไม้ ~150 kcal:contentReference[oaicite:11]{index=11}
    baseCalories: 150,
    protein: 10,
    fat: 8,
    carbs: 12,
    engKeywords: [
      "moo ping",
      "thai grilled pork skewers",
      "grilled pork skewers",
      "thai pork skewers",
      "bbq pork skewers",
    ],
  },
  {
    id: "larb_moo",
    thaiName: "ลาบหมู",
    // ลาบหมูจานกลาง ~250 kcal:contentReference[oaicite:12]{index=12}
    baseCalories: 250,
    protein: 15,
    fat: 15,
    carbs: 10,
    engKeywords: [
      "larb moo",
      "thai minced pork salad",
      "spicy minced pork salad",
      "thai larb pork",
      "larb pork salad",
    ]
  },
  {
    id: "gaeng_daeng_chicken",
    thaiName: "แกงแดงไก่",
    // แกงแดงไก่+ข้าวสวย ~520 kcal:contentReference[oaicite:13]{index=13}
    baseCalories: 520,
    protein: 24,
    fat: 21,
    carbs:  28,
    engKeywords: [
      "red curry chicken",
      "thai red curry",
      "red curry with chicken",
      "thai red curry chicken",
      "red curry chicken rice",
    ],
  },
  {
    id: "pad_se_eiw",
    thaiName: "ผัดซีอิ๊ว",
    // ผัดซีอิ๊วไก่ ~450 kcal:contentReference[oaicite:14]{index=14}
    baseCalories: 450,
    protein: 18,
    fat: 16,
    carbs: 60,
    engKeywords: [
      "pad see ew",
      "thai pad see ew",
      "stir fried soy sauce noodles",
      "thai stir fried soy sauce noodles",
      "pad si ew",
    ],
  }
];
