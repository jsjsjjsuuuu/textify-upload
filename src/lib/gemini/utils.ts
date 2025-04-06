
/**
 * تحويل ملف إلى Base64 لاستخدامه مع API الخارجية
 */
export const fileToBase64 = async (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // استخراج بيانات Base64 من نتيجة القراءة
      const base64String = reader.result as string;
      const base64WithoutPrefix = base64String.split(',')[1];
      resolve(base64WithoutPrefix);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * تنسيق السعر للعرض
 */
export const formatPrice = (price: string | number | undefined): string => {
  if (!price) return '';
  
  const numericPrice = typeof price === 'string' ? parseFloat(price.replace(/[^\d.]/g, '')) : price;
  
  if (isNaN(numericPrice)) return '';
  
  return new Intl.NumberFormat('ar-IQ', {
    style: 'currency',
    currency: 'IQD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numericPrice);
};

/**
 * إنشاء عنوان URL موثوق للكائنات Blob
 */
export const createReliableBlobUrl = (blob: Blob): string => {
  try {
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("خطأ في إنشاء عنوان URL للكائن Blob:", error);
    return '';
  }
};

/**
 * تحويل Blob إلى File (مطلوب لبعض وظائف معالجة الصور)
 */
export const blobToFile = (blob: Blob, fileName: string): File => {
  // إنشاء File من Blob
  const file = new File([blob], fileName, { type: blob.type });
  return file;
};

/**
 * تحسين البيانات المستخرجة
 */
export const enhanceExtractedData = (parsedData: Record<string, string>, extractedText?: string): Record<string, string> => {
  const enhancedData = { ...parsedData };
  
  // تنظيف رقم الهاتف إذا وجد
  if (enhancedData.phoneNumber) {
    enhancedData.phoneNumber = enhancedData.phoneNumber.replace(/\D/g, '');
    
    // التأكد من أن رقم الهاتف يحتوي على 11 رقم
    if (enhancedData.phoneNumber.length !== 11 && extractedText) {
      // البحث عن أرقام هواتف في النص الكامل
      const phonePattern = /\b(07\d{2}\s*\d{3}\s*\d{4})\b/g;
      const phoneMatches = extractedText.match(phonePattern);
      
      if (phoneMatches && phoneMatches.length > 0) {
        // استخدام أول رقم هاتف تم العثور عليه
        enhancedData.phoneNumber = phoneMatches[0].replace(/\D/g, '');
      }
    }
  }
  
  // تحسين استخراج السعر
  if (enhancedData.price) {
    // تنظيف السعر من أي أحرف غير رقمية
    const cleanPrice = enhancedData.price.replace(/[^\d.,]/g, '');
    
    // استبدال الفواصل بنقاط عشرية إذا لزم الأمر
    enhancedData.price = cleanPrice.replace(/,/g, '.');
  }
  
  return enhancedData;
};

/**
 * حساب نسبة الثقة في البيانات المستخرجة
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
      // للكود، تحقق من أنه رقم صالح
      if (field === 'code') {
        if (/^\d+$/.test(data[field].toString())) {
          score += weights[field];
        } else {
          score += weights[field] * 0.5; // نصف النتيجة للكود غير الرقمي
        }
      } 
      // لرقم الهاتف، تحقق من أنه في التنسيق الصحيح
      else if (field === 'phoneNumber') {
        const digits = data[field].toString().replace(/\D/g, '');
        if (digits.length === 11) {
          score += weights[field];
        } else {
          score += weights[field] * 0.5; // نصف النتيجة لتنسيق الهاتف غير الصالح
        }
      } 
      // للسعر، تحقق من أنه رقم صالح
      else if (field === 'price') {
        if (/^\d+(\.\d+)?$/.test(data[field].toString())) {
          score += weights[field];
        } else {
          score += weights[field] * 0.5; // نصف النتيجة لتنسيق السعر غير الصالح
        }
      } 
      // للحقول النصية، تحقق من الطول
      else {
        if (data[field].toString().length > 2) {
          score += weights[field];
        } else {
          score += weights[field] * 0.7; // 70% من النتيجة للنص القصير
        }
      }
    }
  }
  
  return Math.min(Math.round(score), 100);
};
