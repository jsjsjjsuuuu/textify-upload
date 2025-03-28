
/**
 * أنماط أرقام الهواتف العراقية المعروفة
 * (قد تحتاج إلى تحديث بناءً على احتياجاتك الخاصة)
 */
const PHONE_PATTERNS = [
  // نمط عراقي قياسي (11 رقم)
  /^(\+?964|0)?7\d{9}$/,
  
  // أنماط مع رموز خاصة
  /^(\+?964|0)?[ -]?7\d{2}[ -]?\d{3}[ -]?\d{4}$/,
  /^(\+?964|0)?[ -]?7\d{2}[ -]?\d{7}$/,
  
  // أنماط مع أقواس
  /^(\+?964|0)?[ -]?\(7\d{2}\)[ -]?\d{3}[ -]?\d{4}$/,
  
  // أنماط مع فواصل
  /^(\+?964|0)?[ -]?7\d{2}[.-]?\d{3}[.-]?\d{4}$/,
];

/**
 * التحقق من صحة رقم الهاتف العراقي
 */
export function isValidIraqiPhoneNumber(phoneNumber: string): boolean {
  // إزالة جميع الرموز غير الرقمية للتحقق من طول الرقم الأساسي
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // التحقق من أن الرقم يحتوي على 10 أو 11 رقمًا (رقم عراقي نموذجي)
  if (!(digitsOnly.length === 10 || digitsOnly.length === 11)) {
    return false;
  }
  
  // التحقق من أنماط الهواتف العراقية
  return PHONE_PATTERNS.some(pattern => pattern.test(phoneNumber));
}

/**
 * تنسيق رقم الهاتف العراقي إلى تنسيق موحد
 */
export function formatIraqiPhoneNumber(phoneNumber: string): string {
  // إزالة جميع الرموز غير الرقمية
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // التعامل مع الرموز الدولية
  let nationalNumber = digitsOnly;
  if (digitsOnly.startsWith('964')) {
    nationalNumber = digitsOnly.substring(3);
  }
  
  // إضافة صفر في البداية إذا لم يكن موجودًا وكان الرقم 10 أرقام
  if (nationalNumber.length === 10 && !nationalNumber.startsWith('0')) {
    nationalNumber = '0' + nationalNumber;
  }
  
  // التحقق من أن الرقم الآن 11 رقمًا
  if (nationalNumber.length !== 11) {
    // إذا لم يكن الرقم 11 رقمًا، نعيده كما هو
    return phoneNumber;
  }
  
  // تنسيق الرقم (مثال: 0771 123 4567)
  return nationalNumber;
}

/**
 * استخراج رقم الهاتف من نص
 */
export function extractPhoneNumber(text: string): string | null {
  // أنماط الاستخراج - أكثر تساهلاً من أنماط التحقق
  const extractionPatterns = [
    // نمط أساسي: 11 رقم متتالي مع 7 بعد الصفر
    /(\+?964|0)?7\d{9}/g,
    
    // نمط مع مسافات أو شرطات
    /(\+?964|0)?[ -]?7\d{2}[ -]?\d{3}[ -]?\d{4}/g,
    
    // أنماط مع أرقام فقط (10 أو 11 رقمًا)
    /\b\d{10,11}\b/g
  ];
  
  for (const pattern of extractionPatterns) {
    // إعادة تعيين lastIndex لضمان البدء من بداية النص في كل مرة
    pattern.lastIndex = 0;
    
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      // تنسيق الرقم واستخدام الأول
      return formatIraqiPhoneNumber(matches[0]);
    }
  }
  
  return null;
}

/**
 * تحسين رقم الهاتف المستخرج بناءً على السياق
 */
export function enhancePhoneNumber(phoneNumber: string, extractedText: string): string {
  if (!phoneNumber) return phoneNumber;
  
  // التحقق إذا كان الرقم يبدأ بـ 7 ويحتوي على 10 أرقام (ينقصه صفر في البداية)
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  if (digitsOnly.length === 10 && digitsOnly.startsWith('7')) {
    return '0' + digitsOnly;
  }
  
  // التحقق إذا كان الرقم يبدأ برمز الدولة 964 ويجب إزالته وإضافة صفر
  if (digitsOnly.startsWith('964') && digitsOnly.length >= 12) {
    return '0' + digitsOnly.substring(3);
  }
  
  return phoneNumber;
}
