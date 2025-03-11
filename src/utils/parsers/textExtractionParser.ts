
import { correctProvinceName, IRAQ_PROVINCES, CITY_PROVINCE_MAP } from "@/utils/provinces";
import { formatPrice } from "@/lib/gemini/utils";
import { enhanceWithLearning } from "@/utils/learningSystem";

/**
 * استخراج اسم الشركة من النص
 */
const extractCompanyName = (text: string): string | undefined => {
  const companyNamePatterns = [
    // البحث عن نص في بداية النص المستخرج (يكون غالبًا في الأعلى)
    /^([^:\n\r]+?)(?:\n|\r|$)/i,
    // البحث عن "شركة" أو "مؤسسة" أو "مجموعة"
    /شركة\s+(.+?)(?:\n|\r|$)/i,
    /مؤسسة\s+(.+?)(?:\n|\r|$)/i,
    /مجموعة\s+(.+?)(?:\n|\r|$)/i,
    /مكتب\s+(.+?)(?:\n|\r|$)/i,
    // البحث عن "company" باللغة الإنجليزية
    /company[:\s]+(.+?)(?:\n|\r|$)/i
  ];
  
  for (const pattern of companyNamePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return undefined;
};

/**
 * محاولة استخراج البيانات باستخدام أنماط مختلفة
 */
export const extractDataWithPatterns = (text: string): Record<string, string> => {
  const result: Record<string, string> = {};
  
  // استخراج اسم الشركة
  const companyName = extractCompanyName(text);
  if (companyName) {
    result.companyName = companyName;
  }
  
  // أنماط محسنة لاستخراج البيانات للسوق العراقي
  const patterns = {
    code: [
      /كود[:\s]+([0-9]+)/i, 
      /code[:\s]+([0-9]+)/i, 
      /رقم[:\s]+([0-9]+)/i,
      /رقم الفاتورة[:\s]+([0-9]+)/i,
      /رقم الطلب[:\s]+([0-9]+)/i,
      /رمز[:\s]+([0-9]+)/i,
      /ID[:\s]+([0-9]+)/i
    ],
    senderName: [
      /اسم المرسل[:\s]+(.+?)(?:\n|\r|$)/i, 
      /sender[:\s]+(.+?)(?:\n|\r|$)/i, 
      /الاسم[:\s]+(.+?)(?:\n|\r|$)/i,
      /الزبون[:\s]+(.+?)(?:\n|\r|$)/i,
      /المرسل[:\s]+(.+?)(?:\n|\r|$)/i,
      /العميل[:\s]+(.+?)(?:\n|\r|$)/i,
      /customer[:\s]+(.+?)(?:\n|\r|$)/i
    ],
    phoneNumber: [
      /هاتف[:\s]+([0-9\-\s]+)/i, 
      /phone[:\s]+([0-9\-\s]+)/i, 
      /جوال[:\s]+([0-9\-\s]+)/i, 
      /رقم الهاتف[:\s]+([0-9\-\s]+)/i,
      /موبايل[:\s]+([0-9\-\s]+)/i,
      /الرقم[:\s]+([0-9\-\s]+)/i,
      /ت[:\s]+([0-9\-\s]+)/i,
      /تلفون[:\s]+([0-9\-\s]+)/i,
      /\b(07\d{8,9})\b/i // البحث عن أي رقم يبدأ ب 07 متبوعًا بـ 8 أو 9 أرقام
    ],
    province: [
      /محافظة[:\s]+(.+?)(?:\n|\r|$)/i, 
      /province[:\s]+(.+?)(?:\n|\r|$)/i, 
      /المدينة[:\s]+(.+?)(?:\n|\r|$)/i,
      /city[:\s]+(.+?)(?:\n|\r|$)/i,
      /منطقة[:\s]+(.+?)(?:\n|\r|$)/i,
      /المحافظة[:\s]+(.+?)(?:\n|\r|$)/i,
      /التوصيل إلى[:\s]+(.+?)(?:\n|\r|$)/i,
      /العنوان[:\s]+(.+?)(?:\n|\r|$)/i
    ],
    price: [
      /سعر[:\s]+(.+?)(?:\n|\r|$)/i, 
      /price[:\s]+(.+?)(?:\n|\r|$)/i, 
      /المبلغ[:\s]+(.+?)(?:\n|\r|$)/i,
      /amount[:\s]+(.+?)(?:\n|\r|$)/i,
      /قيمة[:\s]+(.+?)(?:\n|\r|$)/i,
      /كلفة[:\s]+(.+?)(?:\n|\r|$)/i,
      /الدفع[:\s]+(.+?)(?:\n|\r|$)/i,
      /التكلفة[:\s]+(.+?)(?:\n|\r|$)/i,
      /(\d+) دينار/i,
      /(\d+) د\.ع/i,
      /(\d+) الف/i,
      /(\d+)الف/i,
      /(\d+)k/i,
      /(\d+) k/i
    ]
  };
  
  // محاولة مطابقة كل حقل من الأنماط المحسنة
  for (const [field, fieldPatterns] of Object.entries(patterns)) {
    for (const pattern of fieldPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        result[field] = match[1].trim();
        break;
      }
    }
  }
  
  return result;
};

/**
 * استخراج معلومات المحافظة من النص
 */
export const enhanceWithProvinceData = (text: string, result: Record<string, string>): Record<string, string> => {
  // تصحيح اسم المحافظة للمحافظات العراقية
  if (result.province) {
    result.province = correctProvinceName(result.province);
  }
  
  // إذا لم يتم العثور على المحافظة، ابحث في النص الكامل عن أي محافظة عراقية
  if (!result.province) {
    // البحث عن محافظات مباشرة في النص
    for (const province of IRAQ_PROVINCES) {
      if (text.includes(province)) {
        result.province = province;
        break;
      }
    }
    
    // إذا لم نجد، ابحث عن أسماء المدن الرئيسية
    if (!result.province) {
      for (const [city, province] of Object.entries(CITY_PROVINCE_MAP)) {
        if (text.includes(city)) {
          result.province = province;
          break;
        }
      }
    }
  }
  
  return result;
};

/**
 * محاولة استخراج بيانات JSON من النص
 */
export const extractJsonFromText = (text: string, result: Record<string, string>): Record<string, string> => {
  try {
    const jsonMatch = text.match(/{[\s\S]*?}/);
    if (jsonMatch) {
      try {
        const jsonData = JSON.parse(jsonMatch[0]);
        // دمج البيانات الصالحة من JSON مع النتائج الموجودة
        if (jsonData.code) result.code = jsonData.code;
        if (jsonData.senderName) result.senderName = jsonData.senderName;
        if (jsonData.phoneNumber) result.phoneNumber = jsonData.phoneNumber;
        if (jsonData.province) {
          // تصحيح اسم المحافظة من JSON
          result.province = correctProvinceName(jsonData.province);
        }
        if (jsonData.price) result.price = jsonData.price;
        if (jsonData.companyName) result.companyName = jsonData.companyName;
      } catch (e) {
        console.log("Failed to parse JSON from text:", e);
      }
    }
  } catch (e) {
    console.log("Error looking for JSON in text:", e);
  }
  
  return result;
};

/**
 * تنسيق بيانات الاستخراج للاستخدام
 */
export const cleanExtractedData = (result: Record<string, string>): Record<string, string> => {
  // معالجة السعر وفقًا للقواعد الجديدة للسوق العراقي
  if (result.price) {
    result.price = formatPrice(result.price);
  }
  
  // تحسين رقم الهاتف العراقي
  if (result.phoneNumber) {
    // إزالة المسافات والرموز غير الرقمية
    let phoneNumber = result.phoneNumber.replace(/[^\d]/g, '');
    
    // إذا كان الرقم يبدأ بـ 7 (بدون الصفر)، أضف 0 في البداية
    if (phoneNumber.startsWith('7') && phoneNumber.length === 10) {
      phoneNumber = '0' + phoneNumber;
    }
    
    // إذا كان الرقم يبدأ بـ 964 (رمز العراق الدولي)، استبدله بـ 0
    if (phoneNumber.startsWith('964')) {
      phoneNumber = '0' + phoneNumber.substring(3);
    }
    
    result.phoneNumber = phoneNumber;
  }
  
  return result;
};

/**
 * الدالة الرئيسية لاستخراج البيانات من النص
 */
export const parseDataFromOCRText = (text: string) => {
  console.log("Parsing data from OCR text:", text);
  
  // استخراج البيانات الأولية من النص
  let result = extractDataWithPatterns(text);
  
  // تحسين بيانات المحافظة
  result = enhanceWithProvinceData(text, result);
  
  // محاولة استخراج بيانات JSON
  result = extractJsonFromText(text, result);
  
  // تنظيف وتنسيق البيانات
  result = cleanExtractedData(result);
  
  // تعزيز البيانات المستخرجة من خلال نظام التعلم
  const enhancedResult = enhanceWithLearning(text, result);
  console.log("Enhanced data with learning system:", enhancedResult);
  
  return enhancedResult;
};
