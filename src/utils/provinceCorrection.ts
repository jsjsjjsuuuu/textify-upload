
// قائمة محافظات العراق (18 محافظة)
export const IRAQ_PROVINCES = [
  'بغداد',
  'البصرة',
  'نينوى',
  'أربيل',
  'النجف',
  'ذي قار',
  'كركوك',
  'الأنبار',
  'ديالى',
  'المثنى',
  'القادسية',
  'ميسان',
  'واسط',
  'صلاح الدين',
  'بابل',
  'كربلاء',
  'دهوك',
  'السليمانية'
];

// قائمة بالأخطاء الإملائية الشائعة في أسماء المحافظات وتصحيحاتها
const PROVINCE_CORRECTIONS: Record<string, string> = {
  // بغداد
  'بغداو': 'بغداد',
  'بقداد': 'بغداد',
  'بعداد': 'بغداد',
  'baghdad': 'بغداد',
  'بغدا': 'بغداد',
  'بغداة': 'بغداد',
  
  // البصرة
  'بصره': 'البصرة',
  'بصرة': 'البصرة',
  'البصره': 'البصرة',
  'basra': 'البصرة',
  'basrah': 'البصرة',
  
  // نينوى
  'نينوي': 'نينوى',
  'الموصل': 'نينوى', // اسم المدينة الرئيسية
  'موصل': 'نينوى',
  'nineveh': 'نينوى',
  'mosul': 'نينوى',
  'نينوه': 'نينوى',
  
  // أربيل
  'اربيل': 'أربيل',
  'أربل': 'أربيل',
  'اربل': 'أربيل',
  'erbil': 'أربيل',
  'irbil': 'أربيل',
  'هولير': 'أربيل',
  
  // النجف
  'نجف': 'النجف',
  'النجه': 'النجف',
  'najaf': 'النجف',
  
  // ذي قار
  'ذيقار': 'ذي قار',
  'ذى قار': 'ذي قار',
  'الناصرية': 'ذي قار', // اسم المدينة الرئيسية
  'ناصريه': 'ذي قار',
  'ناصرية': 'ذي قار',
  'dhi qar': 'ذي قار',
  'thi qar': 'ذي قار',
  
  // كركوك
  'كركوج': 'كركوك',
  'كركك': 'كركوك',
  'kirkuk': 'كركوك',
  
  // الأنبار
  'انبار': 'الأنبار',
  'الانبار': 'الأنبار',
  'الرمادي': 'الأنبار', // اسم المدينة الرئيسية
  'رمادي': 'الأنبار',
  'anbar': 'الأنبار',
  
  // ديالى
  'ديالي': 'ديالى',
  'ديإلى': 'ديالى',
  'بعقوبة': 'ديالى', // اسم المدينة الرئيسية
  'diyala': 'ديالى',
  
  // المثنى
  'مثنى': 'المثنى',
  'السماوة': 'المثنى', // اسم المدينة الرئيسية
  'سماوة': 'المثنى',
  'muthanna': 'المثنى',
  
  // القادسية
  'قادسية': 'القادسية',
  'قادسيه': 'القادسية',
  'الديوانية': 'القادسية', // اسم المدينة الرئيسية
  'ديوانية': 'القادسية',
  'qadisiyah': 'القادسية',
  
  // ميسان
  'ميسن': 'ميسان',
  'ميثان': 'ميسان',
  'العمارة': 'ميسان', // اسم المدينة الرئيسية
  'عمارة': 'ميسان',
  'maysan': 'ميسان',
  
  // واسط
  'وسط': 'واسط',
  'واسظ': 'واسط',
  'الكوت': 'واسط', // اسم المدينة الرئيسية
  'كوت': 'واسط',
  'wasit': 'واسط',
  
  // صلاح الدين
  'صلاح': 'صلاح الدين',
  'صلاح الجين': 'صلاح الدين',
  'صلاح الدبن': 'صلاح الدين',
  'صلاحدين': 'صلاح الدين',
  'تكريت': 'صلاح الدين', // اسم المدينة الرئيسية
  'salahuddin': 'صلاح الدين',
  'salah al-din': 'صلاح الدين',
  'صلاة الدين': 'صلاح الدين',
  
  // بابل
  'بابيل': 'بابل',
  'الحلة': 'بابل', // اسم المدينة الرئيسية
  'حلة': 'بابل',
  'babylon': 'بابل',
  'حله': 'بابل',
  
  // كربلاء
  'كربله': 'كربلاء',
  'كربلا': 'كربلاء',
  'karbala': 'كربلاء',
  
  // دهوك
  'دهك': 'دهوك',
  'دهق': 'دهوك',
  'duhok': 'دهوك',
  'dahuk': 'دهوك',
  
  // السليمانية
  'سليمانية': 'السليمانية',
  'سليمانيه': 'السليمانية',
  'sulaymaniyah': 'السليمانية',
  'sulaymaniya': 'السليمانية'
};

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

/**
 * حساب مدى التشابه بين سلسلتين نصيتين باستخدام مسافة ليفنشتاين
 */
export function calculateStringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const m = str1.length;
  const n = str2.length;
  
  // مصفوفة لحساب المسافة
  const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) {
    for (let j = 0; j <= n; j++) {
      if (i === 0) {
        dp[i][j] = j;
      } else if (j === 0) {
        dp[i][j] = i;
      } else if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // حذف
          dp[i][j - 1],     // إدراج
          dp[i - 1][j - 1]  // استبدال
        );
      }
    }
  }
  
  // حساب معامل التشابه
  const maxLength = Math.max(m, n);
  if (maxLength === 0) return 1; // إذا كانت السلسلتان فارغتين
  
  return 1 - dp[m][n] / maxLength;
}
