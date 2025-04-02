
/**
 * وظائف مساعدة لاستخراج البيانات من النص
 */

import { correctProvinceName, IRAQ_PROVINCES, CITY_PROVINCE_MAP } from "./provinces";

/**
 * استخراج قيمة حقل معين من النص باستخدام مجموعة من التعبيرات المنتظمة
 */
export const tryExtractField = (text: string, patterns: RegExp[]): string => {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return "";
};

/**
 * إزالة الأحرف غير الرقمية من النص
 */
export const cleanNumericValue = (value: string): string => {
  if (!value) return "";
  return value.replace(/[^\d]/g, '');
};

/**
 * تنظيف رقم الهاتف وتنسيقه
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return "";
  
  // إزالة الأحرف غير الرقمية
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // تحقق مما إذا كان الرقم يبدأ بـ 07 وطوله 11 رقم
  if (digitsOnly.startsWith('07') && digitsOnly.length === 11) {
    return digitsOnly;
  }
  
  // إذا كان يبدأ برقم 7 فقط، أضف 0 في البداية
  if (digitsOnly.startsWith('7') && digitsOnly.length === 10) {
    return '0' + digitsOnly;
  }
  
  // إعادة الرقم كما هو إذا لم يطابق الشروط
  return digitsOnly;
};

/**
 * استخراج البيانات من النص باستخدام تعبيرات منتظمة متعددة
 */
export const autoExtractData = (text: string): Record<string, string> => {
  console.log("استخراج البيانات تلقائيًا من النص");
  
  const result: Record<string, string> = {};
  
  // تنظيف النص قبل المعالجة (إزالة الأحرف الخاصة وتوحيد المسافات)
  const cleanedText = text
    .replace(/[\u201C\u201D]/g, '"') // استبدال علامات الاقتباس الذكية
    .replace(/[\u2018\u2019]/g, "'") // استبدال علامات الاقتباس المفردة الذكية
    .replace(/،/g, ','); // استبدال الفاصلة العربية بالفاصلة الإنجليزية
  
  // أنماط استخراج اسم الشركة
  const companyNamePatterns = [
    /شركة\s+([^:\n\r]+?)(?:للنقل|للشحن|للتوصيل|\s*(?:\n|\r|$))/i,
    /مجموعة\s+([^:\n\r]+?)(?:\s*(?:\n|\r|$))/i,
    /مؤسسة\s+([^:\n\r]+?)(?:\s*(?:\n|\r|$))/i,
    /^([^:\n\r]+?)(?:\s*(?:\n|\r|$))/
  ];
  
  // استخراج اسم الشركة
  result.companyName = tryExtractField(cleanedText, companyNamePatterns);
  
  // أنماط استخراج الكود
  const codePatterns = [
    /(?:كود|رقم|code)\s*[:;#]\s*([a-zA-Z0-9]+)/i,
    /(?:كود|رقم|code)\s*[:#]\s*([a-zA-Z0-9]+)/i,
    /(?:كود|رقم|code|رقم الوصل)(?:\s|:|؛|_|-)+([a-zA-Z0-9]+)/i,
    /#([a-zA-Z0-9]+)/i,
    /([A-Z]{2,}\d+)/
  ];
  
  // استخراج الكود
  result.code = tryExtractField(cleanedText, codePatterns);
  
  // البحث عن أي كود في النص (مجموعة من الأحرف والأرقام)
  if (!result.code) {
    const codeRegex = /\b([A-Z0-9]{4,})\b/;
    const codeMatch = cleanedText.match(codeRegex);
    if (codeMatch && codeMatch[1]) {
      result.code = codeMatch[1];
    }
  }
  
  // أنماط استخراج اسم المرسل
  const senderNamePatterns = [
    /(?:اسم العميل|اسم المرسل|اسم الزبون|المرسل|الزبون|sender|customer)(?:\s|:|؛|_|-)+([^:\n\r]+?)(?:\s*(?:\n|\r|$))/i,
    /الاسم(?:\s|:|؛|_|-)+([^:\n\r]+?)(?:\s*(?:\n|\r|$))/i,
    /الى(?:\s|:|؛|_|-)+([^:\n\r]+?)(?:\s*(?:\n|\r|$))/i
  ];
  
  // استخراج اسم المرسل
  result.senderName = tryExtractField(cleanedText, senderNamePatterns);
  
  // أنماط استخراج رقم الهاتف
  const phoneNumberPatterns = [
    /(?:رقم الهاتف|رقم|هاتف|تلفون|موبايل|الرقم|phone|mobile)(?:\s|:|؛|_|-)+(\d[\d\s-]{8,}\d)/i,
    /(?:رقم الهاتف|رقم|هاتف|تلفون|موبايل|الرقم|phone|mobile)(?:\s|:|؛|_|-)+([0-9٠-٩]{8,})/i,
    /(\b07\d{9}\b)/,
    /(\b0\d{10}\b)/
  ];
  
  // استخراج واستخلاص رقم الهاتف
  const phoneRaw = tryExtractField(cleanedText, phoneNumberPatterns);
  result.phoneNumber = formatPhoneNumber(phoneRaw);
  
  // البحث عن أي رقم هاتف في النص (11 رقم يبدأ بـ 07)
  if (!result.phoneNumber) {
    const phoneRegex = /\b(07\d{9})\b/;
    const phoneMatch = cleanedText.match(phoneRegex);
    if (phoneMatch && phoneMatch[1]) {
      result.phoneNumber = phoneMatch[1];
    }
  }
  
  // أنماط استخراج المحافظة
  const provincePatterns = [
    /(?:محافظة|المحافظة|province|city)(?:\s|:|؛|_|-)+([^:\n\r]+?)(?:\s*(?:\n|\r|$))/i,
    /(?:إلى|الى)(?:\s|:|؛|_|-)+([^:\n\r]+?)(?:\s*(?:\n|\r|$))/i
  ];
  
  // استخراج المحافظة
  const rawProvince = tryExtractField(cleanedText, provincePatterns);
  result.province = correctProvinceName(rawProvince);
  
  // البحث عن المحافظة في النص الكامل إذا لم يتم العثور عليها
  if (!result.province) {
    // البحث عن أسماء المحافظات مباشرة في النص
    for (const province of IRAQ_PROVINCES) {
      if (cleanedText.includes(province)) {
        result.province = province;
        break;
      }
    }
    
    // البحث عن أسماء المدن إذا لم نجد المحافظة
    if (!result.province) {
      for (const [city, province] of Object.entries(CITY_PROVINCE_MAP)) {
        if (cleanedText.includes(city)) {
          result.province = province;
          break;
        }
      }
    }
  }
  
  // أنماط استخراج السعر
  const pricePatterns = [
    /(?:سعر|المبلغ|قيمة|price|amount)(?:\s|:|؛|_|-)+([0-9٠-٩.,]+\s*(?:د\.ع|دينار|IQD)?)/i,
    /(?:سعر|المبلغ|قيمة|price|amount)(?:\s|:|؛|_|-)+(\d[\d.,\s]*)/i,
    /(\d{4,})\s*(?:د\.ع|دينار|IQD)/i,
    /المبلغ(?:\s|:|؛|_|-)+([0-9٠-٩.,]+)/i
  ];
  
  // استخراج السعر
  const priceRaw = tryExtractField(cleanedText, pricePatterns);
  result.price = cleanNumericValue(priceRaw);
  
  // البحث عن أي سعر في النص (أرقام أكبر من 1000)
  if (!result.price) {
    const priceRegex = /\b(\d{4,})\b/;
    const priceMatch = cleanedText.match(priceRegex);
    if (priceMatch && priceMatch[1]) {
      result.price = priceMatch[1];
    }
  }
  
  console.log("النتائج المستخرجة تلقائيًا:", result);
  
  return result;
};

/**
 * دمج بيانات من مصادر متعددة مع إعطاء الأولوية للبيانات الجديدة
 */
export const mergeExtractedData = (
  existingData: Record<string, string>,
  newData: Record<string, string>
): Record<string, string> => {
  const result = { ...existingData };
  
  // دمج البيانات مع إعطاء الأولوية للبيانات الجديدة فقط إذا كان الحقل الحالي فارغاً
  for (const [key, value] of Object.entries(newData)) {
    if (value && value.trim() !== '' && (!result[key] || result[key].trim() === '')) {
      result[key] = value;
    }
  }
  
  return result;
};
