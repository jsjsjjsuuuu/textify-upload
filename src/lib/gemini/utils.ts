
/**
 * مجموعة الوظائف المساعدة لـ Gemini API
 */

/**
 * تحويل ملف إلى قاعدة Base64
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * إنشاء عنوان URL موثوق للكائن
 * هذا لحل مشكلات الذاكرة المحتملة مع عناوين URL للكائنات
 */
export const createReliableBlobUrl = (file: File): string => {
  try {
    return URL.createObjectURL(file);
  } catch (error) {
    console.error('خطأ في إنشاء عنوان URL للكائن:', error);
    return '';
  }
};

/**
 * تنسيق سعر وفقًا لقواعد العمل
 */
export const formatPrice = (price: string | number): string => {
  if (!price && price !== 0) return '';
  
  // تحويل إلى نص (إذا كان رقمًا)
  const priceText = String(price);
  
  // إذا كان النص فارغاً، إرجاع نص فارغ
  if (!priceText.trim()) return '';
  
  // إزالة أي أحرف غير الأرقام والنقطة (للكسور العشرية)
  const digitsOnly = priceText.replace(/[^\d.]/g, '');
  
  // التعامل مع حالات خاصة: مجاني أو توصيل أو واصل
  if (
    priceText.includes('مجان') || 
    priceText.includes('free') || 
    priceText.includes('توصيل') || 
    priceText.includes('deliver') ||
    priceText.includes('واصل')
  ) {
    return '0';
  }
  
  // إذا لم يبقى أي أرقام بعد التنظيف، إرجاع صفر
  if (!digitsOnly) return '0';
  
  // تحويل النص إلى رقم عشري
  let numValue = parseFloat(digitsOnly);
  
  // إذا كان الرقم أقل من 1000 وأكبر من 0، ضربه في 1000
  if (numValue > 0 && numValue < 1000) {
    numValue *= 1000;
  }
  
  // تقريب الرقم إلى صفر منازل عشرية وتحويله إلى نص
  return Math.round(numValue).toString();
};

/**
 * تعزيز البيانات المستخرجة
 */
export const enhanceExtractedData = (
  extractedData: Record<string, string>, 
  rawText: string
): Record<string, string> => {
  const enhancedData = { ...extractedData };
  
  // تحسين استخراج أرقام الهاتف
  if (enhancedData.phoneNumber) {
    // تنظيف رقم الهاتف من الرموز غير الرقمية
    let phoneDigits = enhancedData.phoneNumber.replace(/\D/g, '');
    
    // إذا بدأ الرقم بـ 00964، أزل هذا الجزء واستبدله بـ 0
    if (phoneDigits.startsWith('00964')) {
      phoneDigits = '0' + phoneDigits.substring(5);
    }
    
    // إذا بدأ الرقم بـ 964، أزل هذا الجزء واستبدله بـ 0
    if (phoneDigits.startsWith('964')) {
      phoneDigits = '0' + phoneDigits.substring(3);
    }
    
    // التأكد من أن الرقم لا يبدأ بصفرين
    if (phoneDigits.startsWith('00')) {
      phoneDigits = '0' + phoneDigits.substring(2);
    }
    
    enhancedData.phoneNumber = phoneDigits;
  } else {
    // البحث عن نمط رقم الهاتف في النص الخام إذا لم يكن موجودًا
    const phonePattern = /\b0?7\d{2}[- ]?\d{3}[- ]?\d{4}\b/g;
    const phoneMatches = rawText.match(phonePattern);
    
    if (phoneMatches && phoneMatches.length > 0) {
      enhancedData.phoneNumber = phoneMatches[0].replace(/\D/g, '');
    }
  }
  
  // البحث عن أنماط الأكواد (الأرقام) إذا لم يتم استخراج الكود
  if (!enhancedData.code) {
    const codePatterns = [
      /\b(\d{5,10})\b/g,  // أي رقم من 5 إلى 10 أرقام
      /\bرقم[\s:]+(\d+)/i,
      /\bcode[\s:]+(\d+)/i,
      /\bكود[\s:]+(\d+)/i
    ];
    
    for (const pattern of codePatterns) {
      const matches = [...rawText.matchAll(pattern)];
      if (matches.length > 0) {
        enhancedData.code = matches[0][1];
        break;
      }
    }
  }
  
  return enhancedData;
};

/**
 * حساب درجة ثقة للبيانات المستخرجة
 */
export const calculateConfidenceScore = (data: Record<string, string>): number => {
  const requiredFields = ['code', 'senderName', 'phoneNumber', 'province', 'price', 'companyName'];
  const fieldWeights = {
    code: 15,
    senderName: 20,
    phoneNumber: 25,
    province: 15,
    price: 15,
    companyName: 10
  };
  
  let totalScore = 0;
  const totalWeight = Object.values(fieldWeights).reduce((sum, weight) => sum + weight, 0);
  
  // حساب النقاط لكل حقل
  for (const field of requiredFields) {
    const weight = fieldWeights[field as keyof typeof fieldWeights] || 0;
    
    if (data[field]) {
      const value = data[field].trim();
      
      if (field === 'phoneNumber') {
        // التحقق من رقم الهاتف
        const phoneDigits = value.replace(/\D/g, '');
        if (phoneDigits.length === 11) {
          totalScore += weight;
        } else if (phoneDigits.length >= 9) {
          totalScore += weight * 0.7;
        } else {
          totalScore += weight * 0.3;
        }
      } else if (field === 'code') {
        // التحقق من الكود
        if (/^\d+$/.test(value)) {
          totalScore += weight;
        } else {
          totalScore += weight * 0.5;
        }
      } else {
        // التحقق من الحقول النصية الأخرى
        if (value.length > 3) {
          totalScore += weight;
        } else if (value.length > 0) {
          totalScore += weight * 0.5;
        }
      }
    }
  }
  
  // حساب النسبة المئوية للثقة
  const confidencePercentage = Math.round((totalScore / totalWeight) * 100);
  return Math.min(confidencePercentage, 100);
};
