
import { ImageData } from "@/types/ImageData";
import { enhanceWithLearning } from "./learningSystem";
import { correctProvinceName, IRAQ_PROVINCES, CITY_PROVINCE_MAP } from "./provinces";

/**
 * Attempts to parse structured data from OCR text
 */
export const parseDataFromOCRText = (text: string) => {
  console.log("Parsing data from OCR text:", text);
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
  
  // Common patterns for data extraction
  const patterns = {
    code: [/كود[:\s]+([0-9]+)/i, /code[:\s]+([0-9]+)/i, /رقم[:\s]+([0-9]+)/i],
    senderName: [/اسم المرسل[:\s]+(.+?)(?:\n|\r|$)/i, /sender[:\s]+(.+?)(?:\n|\r|$)/i, /الاسم[:\s]+(.+?)(?:\n|\r|$)/i],
    phoneNumber: [/هاتف[:\s]+([0-9\-]+)/i, /phone[:\s]+([0-9\-]+)/i, /جوال[:\s]+([0-9\-]+)/i, /رقم الهاتف[:\s]+([0-9\-]+)/i],
    province: [/محافظة[:\s]+(.+?)(?:\n|\r|$)/i, /province[:\s]+(.+?)(?:\n|\r|$)/i, /المدينة[:\s]+(.+?)(?:\n|\r|$)/i],
    price: [/سعر[:\s]+(.+?)(?:\n|\r|$)/i, /price[:\s]+(.+?)(?:\n|\r|$)/i, /المبلغ[:\s]+(.+?)(?:\n|\r|$)/i]
  };
  
  // Try to match each field
  for (const [field, fieldPatterns] of Object.entries(patterns)) {
    for (const pattern of fieldPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        result[field] = match[1].trim();
        break;
      }
    }
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
  
  // Also try to look for JSON in the text
  try {
    const jsonMatch = text.match(/{[\s\S]*?}/);
    if (jsonMatch) {
      try {
        const jsonData = JSON.parse(jsonMatch[0]);
        // Merge any valid data from JSON with existing results
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
  
  // Process price according to the new rules
  if (result.price) {
    result.price = formatPrice(result.price);
  }
  
  // تعزيز البيانات المستخرجة من خلال نظام التعلم
  const enhancedResult = enhanceWithLearning(text, result);
  console.log("Enhanced data with learning system:", enhancedResult);
  
  return enhancedResult;
};

/**
 * Formats price according to business rules
 * - If price is a single number less than 1000, multiply by 1000
 * - If price is "free", "0", "مجاني", "واصل" or "delivered", set to 0
 * - Otherwise clean and return as is
 */
export const formatPrice = (price: string): string => {
  // تنظيف قيمة السعر - إزالة الأحرف غير الرقمية باستثناء النقطة العشرية
  const cleanedPrice = price.toString().replace(/[^\d.]/g, '').trim();
  
  // التحقق مما إذا كان السعر "مجاني" أو "صفر" أو "توصيل" أو ما شابه
  if (
    price.toLowerCase().includes('free') || 
    price.includes('مجان') || 
    price === '0' ||
    price.includes('صفر') || 
    cleanedPrice === '0' || 
    price.toLowerCase().includes('delivered') || 
    price.toLowerCase().includes('delivery') || 
    price.includes('توصيل') ||
    price.includes('واصل')
  ) {
    console.log(`Price "${price}" identified as free/delivered, setting to 0`);
    return '0';
  }
  
  // إذا كان مجرد رقم بسيط (مثل 22 أو 50)، اضربه في 1000
  if (/^\d+$/.test(cleanedPrice) && !price.includes(',') && !price.includes('.')) {
    const numValue = parseInt(cleanedPrice, 10);
    if (numValue > 0 && numValue < 100000) {  // تحقق أنه أقل من 100000
      // تحقق إذا كان الرقم أقل من 1000 - بحاجة للضرب
      if (numValue < 1000) {
        const formattedPrice = (numValue * 1000).toString();
        console.log(`Price "${price}" converted to ${formattedPrice} (multiplied by 1000)`);
        return formattedPrice;
      }
    }
  }
  
  // تنظيف السعر بإزالة الفواصل والمسافات
  if (cleanedPrice !== price) {
    console.log(`Price "${price}" cleaned to ${cleanedPrice}`);
    return cleanedPrice || '0';
  }
  
  return price;
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
      // For code, check if it's a valid number
      if (field === 'code') {
        if (/^\d+$/.test(data[field].toString())) {
          score += weights[field];
        } else {
          score += weights[field] * 0.5; // Half score for non-numeric code
        }
      } 
      // For phone number, check if it's in correct format
      else if (field === 'phoneNumber') {
        const digits = data[field].toString().replace(/\D/g, '');
        if (digits.length === 11) {
          score += weights[field];
        } else {
          score += weights[field] * 0.5; // Half score for invalid phone format
        }
      } 
      // For price, check if it's a valid number
      else if (field === 'price') {
        if (/^\d+(\.\d+)?$/.test(data[field].toString())) {
          score += weights[field];
        } else {
          score += weights[field] * 0.5; // Half score for invalid price format
        }
      } 
      // For text fields, check length
      else {
        if (data[field].toString().length > 2) {
          score += weights[field];
        } else {
          score += weights[field] * 0.7; // 70% score for short text
        }
      }
    }
  }
  
  return Math.min(Math.round(score), 100);
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
  // Format the price before updating
  if (parsedData.price) {
    parsedData.price = formatPrice(parsedData.price);
  }
  
  // Calculate confidence score if not provided
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
