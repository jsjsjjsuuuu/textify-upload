
import { ImageData } from "@/types/ImageData";
import { formatPrice } from "@/lib/gemini/utils";

/**
 * تحديث بيانات الصورة بالنص المستخرج والبيانات المحللة
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
 * حساب درجة الثقة في البيانات المستخرجة
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
      // للرمز، تحقق إذا كان رقمًا صالحًا
      if (field === 'code') {
        if (/^\d+$/.test(data[field].toString())) {
          score += weights[field];
        } else {
          score += weights[field] * 0.5; // نصف النقاط لرمز غير رقمي
        }
      } 
      // لرقم الهاتف، تحقق إذا كان بالتنسيق الصحيح
      else if (field === 'phoneNumber') {
        const digits = data[field].toString().replace(/\D/g, '');
        if (digits.length === 11) {
          score += weights[field];
        } else {
          score += weights[field] * 0.5; // نصف النقاط لتنسيق هاتف غير صالح
        }
      } 
      // للسعر، تحقق إذا كان رقمًا صالحًا
      else if (field === 'price') {
        if (/^\d+(\.\d+)?$/.test(data[field].toString())) {
          score += weights[field];
        } else {
          score += weights[field] * 0.5; // نصف النقاط لتنسيق سعر غير صالح
        }
      } 
      // للحقول النصية، تحقق من الطول
      else {
        if (data[field].toString().length > 2) {
          score += weights[field];
        } else {
          score += weights[field] * 0.7; // 70% من النقاط للنص القصير
        }
      }
    }
  }
  
  return Math.min(Math.round(score), 100);
};
