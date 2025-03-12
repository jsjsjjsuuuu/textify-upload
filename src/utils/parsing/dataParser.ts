
import { ImageData } from "@/types/ImageData";
import { calculateConfidenceScore } from "./confidenceCalculator";
import { enhanceWithLearning } from "../learningSystem";
import { correctProvinceName, IRAQ_PROVINCES, CITY_PROVINCE_MAP } from "../provinces";
import { formatPrice } from "./formatters";

/**
 * يحاول تحليل البيانات المنظمة من نص OCR
 */
export const parseDataFromOCRText = (text: string) => {
  console.log("Parsing data from OCR text:", text);
  const result: Record<string, string> = {};
  
  // استخراج اسم الشركة
  const companyNamePatterns = [
    /^([^:\n\r]+?)(?:\n|\r|$)/i,
    /شركة\s+(.+?)(?:\n|\r|$)/i,
    /مؤسسة\s+(.+?)(?:\n|\r|$)/i,
    /مجموعة\s+(.+?)(?:\n|\r|$)/i,
    /مكتب\s+(.+?)(?:\n|\r|$)/i,
    /company[:\s]+(.+?)(?:\n|\r|$)/i
  ];
  
  for (const pattern of companyNamePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.companyName = match[1].trim();
      break;
    }
  }
  
  // أنماط استخراج البيانات للسوق العراقي
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
      /\b(07\d{8,9})\b/i
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
  
  // مطابقة كل حقل من الأنماط
  for (const [field, fieldPatterns] of Object.entries(patterns)) {
    for (const pattern of fieldPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        result[field] = match[1].trim();
        break;
      }
    }
  }
  
  // تصحيح اسم المحافظة للمحافظات العراقية
  if (result.province) {
    result.province = correctProvinceName(result.province);
  }
  
  // البحث في النص الكامل عن محافظات إذا لم تُكتشف
  if (!result.province) {
    // البحث عن محافظات مباشرة في النص
    for (const province of IRAQ_PROVINCES) {
      if (text.includes(province)) {
        result.province = province;
        break;
      }
    }
    
    // البحث عن أسماء المدن الرئيسية
    if (!result.province) {
      for (const [city, province] of Object.entries(CITY_PROVINCE_MAP)) {
        if (text.includes(city)) {
          result.province = province;
          break;
        }
      }
    }
  }
  
  // محاولة استخراج JSON من النص
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
  
  // معالجة السعر
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
  
  // تعزيز البيانات باستخدام نظام التعلم
  const enhancedResult = enhanceWithLearning(text, result);
  console.log("Enhanced data with learning system:", enhancedResult);
  
  return enhancedResult;
};

/**
 * تحديث الصورة بالبيانات المستخرجة
 */
export const updateImageWithExtractedData = (
  image: ImageData, 
  extractedText: string, 
  parsedData: Record<string, string>,
  confidence: number = 0,
  method: "ocr" | "gemini" = "ocr"
): ImageData => {
  // تنسيق السعر قبل التحديث
  if (parsedData.price) {
    parsedData.price = formatPrice(parsedData.price);
  }
  
  // حساب درجة الثقة إذا لم يتم توفيرها
  if (!confidence) {
    confidence = calculateConfidenceScore(parsedData);
  }
  
  return {
    ...image,
    extractedText,
    confidence,
    code: parsedData.code || "",
    senderName: parsedData.senderName || "",
    phoneNumber: parsedData.phoneNumber || "",
    province: parsedData.province || "",
    price: parsedData.price || "",
    companyName: parsedData.companyName || "",
    status: "completed",
    extractionMethod: method
  };
};
