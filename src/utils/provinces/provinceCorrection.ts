
import { PROVINCE_CORRECTIONS, IRAQ_PROVINCES, CITY_PROVINCE_MAP } from "./provinceData";
import { findClosestMatch } from "./stringSimilarity";

// Cache for province corrections to improve performance
const correctionCache = new Map<string, string>();

/**
 * تصحيح اسم المحافظة باستخدام قائمة التصحيحات المعروفة
 * مع تحسين الأداء من خلال التخزين المؤقت
 */
export function correctProvinceName(provinceName: string | null | undefined): string {
  if (!provinceName) return "";
  
  // تحويل النص إلى تنسيق موحد
  const normalizedName = provinceName.trim().toLowerCase();
  
  // التحقق من التخزين المؤقت أولاً
  if (correctionCache.has(normalizedName)) {
    return correctionCache.get(normalizedName) || "";
  }
  
  // البحث في قائمة التصحيحات المعروفة
  if (normalizedName in PROVINCE_CORRECTIONS) {
    const correctedName = PROVINCE_CORRECTIONS[normalizedName];
    correctionCache.set(normalizedName, correctedName);
    return correctedName;
  }
  
  // البحث في قائمة المدن وربطها بالمحافظات
  if (normalizedName in CITY_PROVINCE_MAP) {
    const correctedName = CITY_PROVINCE_MAP[normalizedName];
    correctionCache.set(normalizedName, correctedName);
    return correctedName;
  }
  
  // استخدام خوارزمية التشابه النصي للبحث عن أقرب تطابق
  const closestMatch = findClosestMatch(normalizedName, IRAQ_PROVINCES);
  
  if (closestMatch) {
    correctionCache.set(normalizedName, closestMatch);
    return closestMatch;
  }
  
  // إذا لم يتم العثور على تطابق، قم بإرجاع الاسم الأصلي مع تحسين التنسيق
  const formattedName = provinceName.trim();
  correctionCache.set(normalizedName, formattedName);
  return formattedName;
}

/**
 * تحليل نص للعثور على أسماء المحافظات
 */
export function extractProvincesFromText(text: string): string[] {
  if (!text) return [];
  
  const provinces: string[] = [];
  const words = text.split(/[\s,،.;:]+/);
  
  for (const word of words) {
    const corrected = correctProvinceName(word);
    if (corrected && IRAQ_PROVINCES.includes(corrected) && !provinces.includes(corrected)) {
      provinces.push(corrected);
    }
  }
  
  return provinces;
}

/**
 * مسح ذاكرة التخزين المؤقت للتصحيحات
 * مفيدة في حالة تحديث قوائم التصحيح
 */
export function clearProvinceCorrectionsCache(): void {
  correctionCache.clear();
}
