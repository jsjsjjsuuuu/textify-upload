
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
  
  // معالجة خاصة للأنماط المختلفة من الكتابة
  if (normalizedName.includes('بغداد') || normalizedName.includes('بقداد')) {
    return 'بغداد';
  } else if (normalizedName.includes('بصرة') || normalizedName.includes('البصره')) {
    return 'البصرة';
  } else if (normalizedName.includes('المثنى') || normalizedName.includes('سماوة') || normalizedName.includes('السماوة')) {
    return 'المثنى';
  } else if (normalizedName.includes('ذي قار') || normalizedName.includes('ذيقار') || normalizedName.includes('ناصرية')) {
    return 'ذي قار';
  } else if (normalizedName.includes('صلاح الدين') || normalizedName.includes('صلاحدين') || normalizedName.includes('تكريت')) {
    return 'صلاح الدين';
  } else if (normalizedName.includes('نجف') || normalizedName.includes('النجف')) {
    return 'النجف';
  } else if (normalizedName.includes('اربيل') || normalizedName.includes('أربيل') || normalizedName.includes('هولير')) {
    return 'أربيل';
  } else if (normalizedName.includes('الانبار') || normalizedName.includes('انبار') || normalizedName.includes('الأنبار') || normalizedName.includes('رمادي')) {
    return 'الأنبار';
  } else if (normalizedName.includes('بابل') || normalizedName.includes('حلة') || normalizedName.includes('الحلة')) {
    return 'بابل';
  } else if (normalizedName.includes('دهوك') || normalizedName.includes('دهوق')) {
    return 'دهوك';
  } else if (normalizedName.includes('ديالى') || normalizedName.includes('ديالة') || normalizedName.includes('بعقوبة')) {
    return 'ديالى';
  } else if (normalizedName.includes('سليمانية') || normalizedName.includes('السليمانية')) {
    return 'السليمانية';
  } else if (normalizedName.includes('كربلاء') || normalizedName.includes('كربلة')) {
    return 'كربلاء';
  } else if (normalizedName.includes('كركوك') || normalizedName.includes('التأميم')) {
    return 'كركوك';
  } else if (normalizedName.includes('ميسان') || normalizedName.includes('عمارة') || normalizedName.includes('العمارة')) {
    return 'ميسان';
  } else if (normalizedName.includes('نينوى') || normalizedName.includes('موصل') || normalizedName.includes('الموصل')) {
    return 'نينوى';
  } else if (normalizedName.includes('واسط') || normalizedName.includes('كوت') || normalizedName.includes('الكوت')) {
    return 'واسط';
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
