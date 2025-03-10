
import { IRAQ_PROVINCES, PROVINCE_CORRECTIONS } from './provinceData';
import { calculateStringSimilarity } from './stringSimilarity';

/**
 * تصحيح اسم المحافظة عن طريق مقارنتها بقائمة المحافظات العراقية
 * وتصحيح الأخطاء الإملائية الشائعة
 */
export function correctProvinceName(provinceName: string): string {
  if (!provinceName) return '';
  
  // تحويل الاسم إلى حروف صغيرة لتسهيل المقارنة (للأسماء اللاتينية)
  const normalizedName = provinceName.trim();
  
  // التحقق من وجود تصحيح مباشر في قائمة التصحيحات
  if (PROVINCE_CORRECTIONS[normalizedName]) {
    return PROVINCE_CORRECTIONS[normalizedName];
  }
  
  // التحقق مما إذا كان الاسم موجودًا في قائمة المحافظات (تطابق كامل)
  if (IRAQ_PROVINCES.includes(normalizedName)) {
    return normalizedName;
  }
  
  // البحث عن أفضل تطابق جزئي
  for (const [wrongName, correctName] of Object.entries(PROVINCE_CORRECTIONS)) {
    // تحقق من وجود تطابق جزئي (اسم خاطئ موجود في النص)
    if (normalizedName.includes(wrongName) || wrongName.includes(normalizedName)) {
      return correctName;
    }
  }
  
  // البحث عن محافظة تبدأ بنفس الحروف (على الأقل 2 حروف مشتركة)
  if (normalizedName.length >= 2) {
    for (const province of IRAQ_PROVINCES) {
      if (province.startsWith(normalizedName.substring(0, 2)) || 
          normalizedName.startsWith(province.substring(0, 2))) {
        return province;
      }
    }
  }
  
  // استخدام حساب درجة التشابه إذا لم نجد تطابقًا بالطرق السابقة
  let bestMatch = '';
  let highestSimilarity = 0;
  
  for (const province of IRAQ_PROVINCES) {
    const similarity = calculateStringSimilarity(normalizedName, province);
    if (similarity > highestSimilarity && similarity > 0.6) { // الحد الأدنى للتشابه 60%
      highestSimilarity = similarity;
      bestMatch = province;
    }
  }
  
  if (bestMatch) {
    return bestMatch;
  }
  
  // إذا لم يتم العثور على تطابق، إرجاع الاسم الأصلي
  return provinceName;
}
