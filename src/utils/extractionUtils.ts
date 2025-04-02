
/**
 * وظائف مساعدة لاستخراج البيانات من النص
 */

import { correctProvinceName, IRAQ_PROVINCES, CITY_PROVINCE_MAP } from "./provinces";

/**
 * استخراج قيمة حقل معين من النص باستخدام مجموعة من التعبيرات المنتظمة
 */
export const tryExtractField = (text: string, patterns: RegExp[]): string => {
  // التحقق من وجود نص للمعالجة
  if (!text) return "";
  
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
  // تحسين التنظيف ليشمل الأرقام العربية أيضًا
  return value.replace(/[^\d٠-٩]/g, '')
    .replace(/٠/g, '0')
    .replace(/١/g, '1')
    .replace(/٢/g, '2')
    .replace(/٣/g, '3')
    .replace(/٤/g, '4')
    .replace(/٥/g, '5')
    .replace(/٦/g, '6')
    .replace(/٧/g, '7')
    .replace(/٨/g, '8')
    .replace(/٩/g, '9');
};

/**
 * تنظيف وتنسيق رقم الهاتف
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return "";
  
  // إزالة الأحرف غير الرقمية
  const digitsOnly = cleanNumericValue(phoneNumber);
  
  // تحقق مما إذا كان الرقم يبدأ بـ 07 وطوله 11 رقم
  if (digitsOnly.startsWith('07') && digitsOnly.length === 11) {
    return digitsOnly;
  }
  
  // إذا كان يبدأ برقم 7 فقط، أضف 0 في البداية
  if (digitsOnly.startsWith('7') && digitsOnly.length === 10) {
    return '0' + digitsOnly;
  }
  
  // إذا كان طوله 10 أرقام ولكن لا يبدأ بـ 7، أضف 0 في البداية
  if (digitsOnly.length === 10) {
    return '0' + digitsOnly;
  }
  
  // إذا كان الرقم يشبه رقم الهاتف العراقي (يحتوي على 07 في البداية)
  if (digitsOnly.includes('07')) {
    const indexOfZero = digitsOnly.indexOf('07');
    const potentialPhoneNumber = digitsOnly.substring(indexOfZero);
    if (potentialPhoneNumber.length >= 11) {
      return potentialPhoneNumber.substring(0, 11);
    }
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
  
  if (!text || text.trim() === "") {
    console.log("النص فارغ، لا يمكن استخراج البيانات");
    return result;
  }
  
  // تنظيف النص قبل المعالجة (إزالة الأحرف الخاصة وتوحيد المسافات)
  const cleanedText = text
    .replace(/[\u201C\u201D]/g, '"') // استبدال علامات الاقتباس الذكية
    .replace(/[\u2018\u2019]/g, "'") // استبدال علامات الاقتباس المفردة الذكية
    .replace(/،/g, ',') // استبدال الفاصلة العربية بالفاصلة الإنجليزية
    .replace(/\s+/g, ' ') // توحيد المسافات المتعددة
    .trim();
  
  // أنماط استخراج اسم الشركة - تحسين الأنماط لتكون أكثر دقة
  const companyNamePatterns = [
    /شركة\s+([^:\n\r]+?)(?:للنقل|للشحن|للتوصيل|\s*(?:\n|\r|$))/i,
    /مؤسسة\s+([^:\n\r]+?)(?:\s*(?:\n|\r|$))/i,
    /مجموعة\s+([^:\n\r]+?)(?:\s*(?:\n|\r|$))/i,
    /^([^:\n\r]+?)(?:\s*(?:\n|\r|$))/,
    /\bلوجستك\b\s*([^:\n\r]+?)(?:\s*(?:\n|\r|$))/i,
    /\bلوجستيك\b\s*([^:\n\r]+?)(?:\s*(?:\n|\r|$))/i,
    /\bexpress\b\s*([^:\n\r]+?)(?:\s*(?:\n|\r|$))/i,
    /\bشحن\b\s*([^:\n\r]+?)(?:\s*(?:\n|\r|$))/i,
    /\bتوصيل\b\s*([^:\n\r]+?)(?:\s*(?:\n|\r|$))/i,
    /company\s*[:;]?\s*([^:\n\r]+?)(?:\s*(?:\n|\r|$))/i
  ];
  
  // استخراج اسم الشركة
  result.companyName = tryExtractField(cleanedText, companyNamePatterns);
  
  // أنماط استخراج الكود - تحسين الأنماط لتشمل المزيد من الحالات
  const codePatterns = [
    /(?:كود|رقم|code|no|number|#)\s*[:;#]\s*([a-zA-Z0-9]+)/i,
    /(?:كود|رقم|code|no|number)\s*[:#]\s*([a-zA-Z0-9]+)/i,
    /(?:كود|رقم|code|رقم الوصل)(?:\s|:|؛|_|-)+([a-zA-Z0-9]+)/i,
    /#([a-zA-Z0-9]+)/i,
    /([A-Z]{2,}\d+)/,
    /(\d{4,}[A-Z]{1,3})/,
    /وصل(?:\s|:|؛|_|-)+([a-zA-Z0-9]+)/i,
    /receipt(?:\s|:|؛|_|-)+([a-zA-Z0-9]+)/i,
    /order(?:\s|:|؛|_|-)+([a-zA-Z0-9]+)/i,
    /فاتورة(?:\s|:|؛|_|-)+([a-zA-Z0-9]+)/i,
    /invoice(?:\s|:|؛|_|-)+([a-zA-Z0-9]+)/i
  ];
  
  // استخراج الكود
  result.code = tryExtractField(cleanedText, codePatterns);
  
  // البحث عن أي كود في النص (مجموعة من الأحرف والأرقام)
  if (!result.code) {
    // أنماط كود إضافية أكثر عمومية عندما لا نجد كود بالأنماط المحددة
    const additionalCodePatterns = [
      /\b([A-Z0-9]{4,})\b/,
      /\b([A-Z]{2,}\d{2,})\b/,
      /\b(\d{4,})\b/
    ];
    
    result.code = tryExtractField(cleanedText, additionalCodePatterns);
  }
  
  // أنماط استخراج اسم المرسل
  const senderNamePatterns = [
    /(?:اسم العميل|اسم المرسل|اسم الزبون|المرسل|الزبون|sender|customer|client|name)(?:\s|:|؛|_|-)+([^:\n\r0-9]+?)(?:\s*(?:\n|\r|$))/i,
    /الاسم(?:\s|:|؛|_|-)+([^:\n\r0-9]+?)(?:\s*(?:\n|\r|$))/i,
    /الى(?:\s|:|؛|_|-)+([^:\n\r0-9]+?)(?:\s*(?:\n|\r|$))/i,
    /to(?:\s|:|؛|_|-)+([^:\n\r0-9]+?)(?:\s*(?:\n|\r|$))/i,
    /recipient(?:\s|:|؛|_|-)+([^:\n\r0-9]+?)(?:\s*(?:\n|\r|$))/i,
    /عميل(?:\s|:|؛|_|-)+([^:\n\r0-9]+?)(?:\s*(?:\n|\r|$))/i
  ];
  
  // استخراج اسم المرسل
  result.senderName = tryExtractField(cleanedText, senderNamePatterns);
  
  // أنماط استخراج رقم الهاتف
  const phoneNumberPatterns = [
    /(?:رقم الهاتف|رقم|هاتف|تلفون|موبايل|الرقم|phone|mobile|tel|number)(?:\s|:|؛|_|-)+(\d[\d\s-]{8,}\d)/i,
    /(?:رقم الهاتف|رقم|هاتف|تلفون|موبايل|الرقم|phone|mobile|tel|number)(?:\s|:|؛|_|-)+([0-9٠-٩]{8,})/i,
    /(?:جوال|نقال|contact)(?:\s|:|؛|_|-)+(\d[\d\s-]{8,}\d)/i,
    /(\b07\d{9}\b)/,
    /(\b0\d{10}\b)/,
    /(\+964\d{9,10})/,
    /(\+?964[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{4})/
  ];
  
  // استخراج واستخلاص رقم الهاتف
  const phoneRaw = tryExtractField(cleanedText, phoneNumberPatterns);
  result.phoneNumber = formatPhoneNumber(phoneRaw);
  
  // البحث عن أي رقم هاتف في النص
  if (!result.phoneNumber) {
    // البحث عن أي رقم يشبه رقم الهاتف العراقي في النص الكامل
    const phoneRegex = /\b(07\d{9})\b/g;
    const phoneMatches = [...cleanedText.matchAll(phoneRegex)];
    
    if (phoneMatches.length > 0) {
      result.phoneNumber = phoneMatches[0][1];
    } else {
      // بحث أكثر مرونة عن أرقام الهاتف
      const flexiblePhoneRegex = /\b(0\d{10})\b|\b(\d{10,11})\b/g;
      const flexMatches = [...cleanedText.matchAll(flexiblePhoneRegex)];
      
      if (flexMatches.length > 0) {
        const potentialPhone = flexMatches[0][1] || flexMatches[0][2];
        result.phoneNumber = formatPhoneNumber(potentialPhone);
      }
    }
  }
  
  // أنماط استخراج المحافظة
  const provincePatterns = [
    /(?:محافظة|المحافظة|province|city|مدينة|المدينة)(?:\s|:|؛|_|-)+([^:\n\r0-9]+?)(?:\s*(?:\n|\r|$))/i,
    /(?:إلى|الى|to)(?:\s|:|؛|_|-)+([^:\n\r0-9]+?)(?:\s*(?:\n|\r|$))/i,
    /destination(?:\s|:|؛|_|-)+([^:\n\r0-9]+?)(?:\s*(?:\n|\r|$))/i,
    /location(?:\s|:|؛|_|-)+([^:\n\r0-9]+?)(?:\s*(?:\n|\r|$))/i,
    /address(?:\s|:|؛|_|-)+([^:\n\r0-9]+?)(?:\s*(?:\n|\r|$))/i,
    /area(?:\s|:|؛|_|-)+([^:\n\r0-9]+?)(?:\s*(?:\n|\r|$))/i
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
    /(?:سعر|المبلغ|قيمة|price|amount|cost|total)(?:\s|:|؛|_|-)+([0-9٠-٩.,]+\s*(?:د\.ع|دينار|IQD|دنار|د\.أ)?)/i,
    /(?:سعر|المبلغ|قيمة|price|amount|cost|total)(?:\s|:|؛|_|-)+(\d[\d.,\s]*)/i,
    /(\d{4,})\s*(?:د\.ع|دينار|IQD|دنار|د\.أ)/i,
    /المبلغ(?:\s|:|؛|_|-)+([0-9٠-٩.,]+)/i,
    /الاجمالي(?:\s|:|؛|_|-)+([0-9٠-٩.,]+)/i,
    /المجموع(?:\s|:|؛|_|-)+([0-9٠-٩.,]+)/i,
    /sum(?:\s|:|؛|_|-)+([0-9٠-٩.,]+)/i
  ];
  
  // استخراج السعر
  const priceRaw = tryExtractField(cleanedText, pricePatterns);
  result.price = cleanNumericValue(priceRaw);
  
  // البحث عن أي سعر في النص (أرقام أكبر من 1000)
  if (!result.price) {
    const priceRegex = /\b(\d{4,})\b/g;
    const priceMatches = [...cleanedText.matchAll(priceRegex)];
    
    if (priceMatches.length > 0) {
      // اختر الرقم الأكبر كاحتمال للسعر
      let maxPrice = 0;
      for (const match of priceMatches) {
        const price = parseInt(match[1], 10);
        if (price > maxPrice) {
          maxPrice = price;
        }
      }
      
      if (maxPrice > 0) {
        result.price = maxPrice.toString();
      }
    }
  }
  
  console.log("النتائج المستخرجة تلقائيًا:", result);
  
  return result;
};

/**
 * دمج بيانات من مصادر متعددة مع إعطاء الأولوية للبيانات غير الفارغة
 */
export const mergeExtractedData = (
  existingData: Record<string, string>,
  newData: Record<string, string>
): Record<string, string> => {
  const result = { ...existingData };
  
  // دمج البيانات مع إعطاء الأولوية للبيانات الجديدة فقط إذا كان الحقل الحالي فارغاً
  for (const [key, value] of Object.entries(newData)) {
    // إذا كانت القيمة الجديدة موجودة وغير فارغة والقيمة الحالية فارغة
    if (value && value.trim() !== '' && (!result[key] || result[key].trim() === '')) {
      result[key] = value;
    } 
    // إذا كانت القيمة الجديدة أفضل من الحالية (مثلاً أطول لبعض الحقول)
    else if (value && value.trim() !== '' && result[key] && result[key].trim() !== '') {
      // للكود، نفضل القيم الأطول أو التي تحتوي على أحرف وأرقام معاً
      if (key === 'code') {
        const currentHasLettersAndNumbers = /[A-Za-z].*\d|\d.*[A-Za-z]/.test(result[key]);
        const newHasLettersAndNumbers = /[A-Za-z].*\d|\d.*[A-Za-z]/.test(value);
        
        if ((newHasLettersAndNumbers && !currentHasLettersAndNumbers) || 
            (newHasLettersAndNumbers === currentHasLettersAndNumbers && value.length > result[key].length)) {
          result[key] = value;
        }
      }
      // لرقم الهاتف، نفضل القيم التي تبدأ بـ 07 وطولها 11 رقم
      else if (key === 'phoneNumber') {
        const currentIsValid = result[key].startsWith('07') && result[key].length === 11;
        const newIsValid = value.startsWith('07') && value.length === 11;
        
        if (newIsValid && !currentIsValid) {
          result[key] = value;
        }
      }
      // للأسماء، نفضل القيم الأطول ما لم تكن طويلة جداً
      else if (key === 'companyName' || key === 'senderName') {
        const maxLength = 50; // الحد الأقصى المعقول للاسم
        
        if (value.length > result[key].length && value.length <= maxLength) {
          result[key] = value;
        }
      }
    }
  }
  
  return result;
};

/**
 * فحص صحة وجودة البيانات المستخرجة
 */
export function validateExtractedData(data: Record<string, string>): Record<string, boolean> {
  const validation: Record<string, boolean> = {};
  
  // التحقق من صحة كود
  validation.code = Boolean(data.code && data.code.length >= 3);
  
  // التحقق من صحة اسم المرسل
  validation.senderName = Boolean(data.senderName && data.senderName.length >= 2);
  
  // التحقق من صحة رقم الهاتف
  validation.phoneNumber = Boolean(
    data.phoneNumber && 
    data.phoneNumber.replace(/\D/g, '').length === 11 && 
    data.phoneNumber.startsWith('07')
  );
  
  // التحقق من صحة المحافظة
  validation.province = Boolean(
    data.province && 
    IRAQ_PROVINCES.includes(data.province)
  );
  
  // التحقق من صحة السعر
  validation.price = Boolean(
    data.price && 
    /^\d+$/.test(data.price) && 
    parseInt(data.price, 10) >= 1000
  );
  
  // التحقق من صحة اسم الشركة
  validation.companyName = Boolean(data.companyName && data.companyName.length >= 2);
  
  return validation;
}

/**
 * حساب ثقة البيانات المستخرجة بناءً على اكتمالها
 */
export function calculateDataConfidence(data: Record<string, string>): number {
  const validation = validateExtractedData(data);
  const fields = Object.keys(validation);
  
  // حساب عدد الحقول الصحيحة
  const validFields = fields.filter(field => validation[field]);
  
  // حساب نسبة الثقة
  return Math.round((validFields.length / fields.length) * 100);
}
