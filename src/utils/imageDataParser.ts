
import { ImageData } from "@/types/ImageData";
import { enhanceWithLearning } from "./learningSystem";
import { correctProvinceName, IRAQ_PROVINCES, CITY_PROVINCE_MAP } from "./provinces";
import { formatPrice } from "@/lib/gemini/utils";
import { isValidIraqiPhoneNumber, formatIraqiPhoneNumber } from "./phoneNumberUtils";

/**
 * Attempts to parse structured data from OCR text
 */
export const parseDataFromOCRText = (text: string) => {
  console.log("تحليل البيانات من نص OCR:", text ? text.substring(0, 200) + "..." : "نص فارغ");
  const result: Record<string, string> = {};
  
  // استخراج اسم الشركة (يكون عادة في أعلى اليسار بخط كبير)
  const companyNamePatterns = [
    // البحث عن نص في بداية النص المستخرج (يكون غالبًا في الأعلى)
    /^([^:\n\r]+?)(?:\n|\r|$)/i,
    // البحث عن "شركة" أو "مؤسسة" أو "مجموعة"
    /شركة\s+(.+?)(?:\n|\r|$)/i,
    /مؤسسة\s+(.+?)(?:\n|\r|$)/i,
    /مجموعة\s+(.+?)(?:\n|\r|$)/i,
    // البحث عن "company" باللغة الإنجليزية
    /company[:\s]+(.+?)(?:\n|\r|$)/i
  ];
  
  for (const pattern of companyNamePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.companyName = match[1].trim();
      break;
    }
  }
  
  // أنماط شائعة لاستخراج البيانات
  const patterns = {
    code: [/كود[:\s]+([0-9]+)/i, /code[:\s]+([0-9]+)/i, /رقم[:\s]+([0-9]+)/i, /رمز[:\s]+([0-9]+)/i],
    senderName: [/اسم المرسل[:\s]+(.+?)(?:\n|\r|$)/i, /sender[:\s]+(.+?)(?:\n|\r|$)/i, /الاسم[:\s]+(.+?)(?:\n|\r|$)/i, /الراسل[:\s]+(.+?)(?:\n|\r|$)/i],
    phoneNumber: [/هاتف[:\s]+([0-9\-\s]+)/i, /phone[:\s]+([0-9\-\s]+)/i, /جوال[:\s]+([0-9\-\s]+)/i, /رقم الهاتف[:\s]+([0-9\-\s]+)/i, /رقم[:\s]+([0-9\-\s]+)/i],
    province: [/محافظة[:\s]+(.+?)(?:\n|\r|$)/i, /province[:\s]+(.+?)(?:\n|\r|$)/i, /المدينة[:\s]+(.+?)(?:\n|\r|$)/i, /المنطقة[:\s]+(.+?)(?:\n|\r|$)/i],
    price: [/سعر[:\s]+(.+?)(?:\n|\r|$)/i, /price[:\s]+(.+?)(?:\n|\r|$)/i, /المبلغ[:\s]+(.+?)(?:\n|\r|$)/i, /قيمة[:\s]+(.+?)(?:\n|\r|$)/i]
  };
  
  // محاولة مطابقة كل حقل
  for (const [field, fieldPatterns] of Object.entries(patterns)) {
    for (const pattern of fieldPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        result[field] = match[1].trim();
        break;
      }
    }
  }
  
  // تصحيح رقم الهاتف
  if (result.phoneNumber) {
    result.phoneNumber = formatIraqiPhoneNumber(result.phoneNumber);
  }
  
  // تصحيح اسم المحافظة
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
  
  // محاولة البحث عن JSON في النص
  try {
    const jsonMatch = text.match(/{[\s\S]*?}/);
    if (jsonMatch) {
      try {
        const jsonData = JSON.parse(jsonMatch[0]);
        // دمج أي بيانات صالحة من JSON مع النتائج الموجودة
        if (jsonData.code) result.code = jsonData.code;
        if (jsonData.senderName) result.senderName = jsonData.senderName;
        if (jsonData.phoneNumber) {
          result.phoneNumber = formatIraqiPhoneNumber(jsonData.phoneNumber);
        }
        if (jsonData.province) {
          // تصحيح اسم المحافظة من JSON
          result.province = correctProvinceName(jsonData.province);
        }
        if (jsonData.price) result.price = jsonData.price;
        if (jsonData.companyName) result.companyName = jsonData.companyName;
      } catch (e) {
        console.log("فشل في تحليل JSON من النص:", e);
      }
    }
  } catch (e) {
    console.log("خطأ في البحث عن JSON في النص:", e);
  }
  
  // معالجة السعر وفقًا للقواعد الجديدة
  if (result.price) {
    result.price = formatPrice(result.price);
  }
  
  // تعزيز البيانات المستخرجة من خلال نظام التعلم
  const enhancedResult = enhanceWithLearning(text, result);
  console.log("تم تعزيز البيانات بنظام التعلم:", enhancedResult);
  
  return enhancedResult;
};

/**
 * Updates an image with extracted data
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

/**
 * Calculates confidence score for the extracted data
 */
export const calculateConfidenceScore = (data: Record<string, string>): number => {
  let score = 0;
  const fields = ['code', 'senderName', 'phoneNumber', 'province', 'price', 'companyName'];
  const weights = {
    code: 20,
    senderName: 15,
    phoneNumber: 20,
    province: 15,
    price: 15,
    companyName: 15
  };
  
  for (const field of fields) {
    if (data[field] && data[field].toString().trim() !== '') {
      // للكود، تحقق ما إذا كان رقمًا صالحًا
      if (field === 'code') {
        if (/^\d+$/.test(data[field].toString())) {
          score += weights[field];
        } else {
          score += weights[field] * 0.5; // نصف درجة للكود غير الرقمي
        }
      } 
      // لرقم الهاتف، تحقق ما إذا كان بالتنسيق الصحيح
      else if (field === 'phoneNumber') {
        const isValid = isValidIraqiPhoneNumber(data[field].toString());
        if (isValid) {
          score += weights[field];
        } else {
          score += weights[field] * 0.5; // نصف درجة لتنسيق الهاتف غير الصالح
        }
      } 
      // للسعر، تحقق ما إذا كان رقمًا صالحًا
      else if (field === 'price') {
        if (/^\d+(\.\d+)?$/.test(data[field].toString().replace(/[^\d.]/g, ''))) {
          score += weights[field];
        } else {
          score += weights[field] * 0.5; // نصف درجة لتنسيق السعر غير الصالح
        }
      } 
      // للحقول النصية، تحقق من الطول
      else {
        if (data[field].toString().length > 2) {
          score += weights[field];
        } else {
          score += weights[field] * 0.7; // 70% من الدرجة للنص القصير
        }
      }
    }
  }
  
  return Math.min(Math.round(score), 100);
};
