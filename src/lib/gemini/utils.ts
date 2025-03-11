
/**
 * تحويل ملف صورة إلى Base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64String = reader.result.split(',')[1];
        console.log("Successfully converted file to base64");
        resolve(base64String);
      } else {
        reject(new Error('FileReader did not return a string'));
      }
    };
    
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      reject(error);
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * تحسين البيانات المستخرجة عن طريق تنظيفها وتحليل النص الكامل للاستدلال على البيانات المفقودة
 */
export function enhanceExtractedData(parsedData: any, fullText: string): any {
  const enhancedData = { ...parsedData };
  
  // تنظيف الكود (حذف أي أحرف غير رقمية)
  if (enhancedData.code) {
    // تنظيف الكود من الأحرف غير الرقمية (مع مراعاة الأرقام العربية)
    enhancedData.code = enhancedData.code.toString().replace(/[^\d٠-٩]/g, '');
    
    // تحويل الأرقام العربية إلى أرقام إنجليزية
    enhancedData.code = enhancedData.code.replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0x0660 + 0x30));
  } else {
    // محاولة استخراج الكود من النص إذا لم يتم العثور عليه
    const codeMatch = fullText.match(/كود[:\s]+([0-9]+)/i) || 
                      fullText.match(/code[:\s]+([0-9]+)/i) || 
                      fullText.match(/رقم[:\s]+([0-9]+)/i) ||
                      fullText.match(/رمز[:\s]+([0-9]+)/i) ||
                      fullText.match(/\b\d{6,9}\b/g); // البحث عن أي رقم من 6 إلى 9 أرقام
                      
    if (codeMatch && codeMatch[1]) {
      enhancedData.code = codeMatch[1].trim();
    } else if (codeMatch && Array.isArray(codeMatch)) {
      enhancedData.code = codeMatch[0].trim();
    }
  }
  
  // تنظيف رقم الهاتف (تنسيق أرقام الهاتف العراقية)
  if (enhancedData.phoneNumber) {
    // إزالة الأحرف غير الرقمية
    enhancedData.phoneNumber = enhancedData.phoneNumber.toString()
      .replace(/[^\d٠-٩\+\-]/g, '')
      .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0x0660 + 0x30));
    
    // إذا كان الرقم لا يبدأ بـ "07" أو "+964"، نحاول إصلاحه
    if (!enhancedData.phoneNumber.match(/^(\+?964|0)7/)) {
      // إذا كان الرقم يبدأ بـ "7" فقط، نضيف "0" قبله
      if (enhancedData.phoneNumber.match(/^7/)) {
        enhancedData.phoneNumber = "0" + enhancedData.phoneNumber;
      }
    }
  } else {
    // محاولة استخراج رقم الهاتف من النص
    const phoneMatch = fullText.match(/هاتف[:\s]+([0-9\-\+\s]+)/i) || 
                       fullText.match(/phone[:\s]+([0-9\-\+\s]+)/i) || 
                       fullText.match(/جوال[:\s]+([0-9\-\+\s]+)/i) || 
                       fullText.match(/رقم الهاتف[:\s]+([0-9\-\+\s]+)/i) ||
                       fullText.match(/\b(07\d{8,9}|\+964\d{8,9})\b/g);
                       
    if (phoneMatch && phoneMatch[1]) {
      enhancedData.phoneNumber = phoneMatch[1].trim();
    } else if (phoneMatch && Array.isArray(phoneMatch)) {
      enhancedData.phoneNumber = phoneMatch[0].trim();
    }
  }
  
  // تنسيق السعر بالطريقة المطلوبة
  if (enhancedData.price) {
    enhancedData.price = formatPrice(enhancedData.price);
  }
  
  return enhancedData;
}

/**
 * تنسيق السعر وفقًا لقواعد محددة للسوق العراقي:
 * - إذا كان السعر رقمًا صغيرًا أقل من 1000، اضربه في 1000
 * - إذا كان "مجاني" أو "توصيل" أو "واصل" أو "0"، اجعله صفرًا
 * - تعامل مع الأسعار بالدينار العراقي والدولار الأمريكي
 */
export function formatPrice(price: string): string {
  console.log(`تنسيق السعر: "${price}"`);
  
  // تحقق إذا كان السعر فارغًا
  if (!price || price.trim() === '') {
    console.log(`السعر فارغ، تعيينه إلى 0`);
    return '0';
  }
  
  // تحويل السعر إلى نص للتأكد
  const priceStr = price.toString();
  
  // التحقق مما إذا كان السعر "مجاني" أو "صفر" أو "توصيل" أو "واصل" أو ما شابه - الكلمات الشائعة في السوق العراقي
  if (
    priceStr.toLowerCase().includes('free') || 
    priceStr.includes('مجان') || 
    priceStr === '0' ||
    priceStr.includes('صفر') || 
    priceStr.toLowerCase().includes('delivered') || 
    priceStr.toLowerCase().includes('delivery') ||
    priceStr.includes('توصيل') ||
    priceStr.includes('واصل') ||
    priceStr.includes('بدون') ||
    priceStr.includes('سلم') ||
    priceStr.includes('خدمة')
  ) {
    console.log(`السعر "${price}" تم تحديده كمجاني/توصيل/واصل، تعيينه إلى 0`);
    return '0';
  }
  
  // إزالة رموز العملة والكلمات غير المهمة
  let cleanedPrice = priceStr.replace(/[$€£د.ع]/g, ''); // إزالة رموز العملة
  cleanedPrice = cleanedPrice.replace(/دينار|دولار|عراقي|alf|الف|ألف|د\.ع\./gi, ''); // إزالة كلمات العملة
  
  // تنظيف قيمة السعر - إزالة الأحرف غير الرقمية باستثناء النقطة العشرية
  cleanedPrice = cleanedPrice.replace(/[^\d.]/g, '').trim();
  
  // التحقق من وجود قيمة بعد التنظيف
  if (!cleanedPrice || cleanedPrice === '') {
    console.log(`السعر "${price}" لا يحتوي على أرقام، تعيينه إلى 0`);
    return '0';
  }
  
  // إذا كان رقم صحيح (بدون فاصلة عشرية)
  if (/^\d+$/.test(cleanedPrice)) {
    const numValue = parseInt(cleanedPrice, 10);
    
    // إذا كان الرقم أقل من 1000 - يجب ضربه في 1000 (شائع في السوق العراقي)
    if (numValue > 0 && numValue < 1000) {
      const formattedPrice = (numValue * 1000).toString();
      console.log(`السعر "${price}" تم تحويله إلى ${formattedPrice} (ضرب × 1000)`);
      return formattedPrice;
    } else if (numValue >= 1000) {
      // إذا كان الرقم 1000 أو أكبر، نعيده كما هو
      console.log(`السعر "${price}" قيمته أكبر من 1000، الإبقاء عليه كما هو: ${numValue}`);
      return numValue.toString();
    }
  }
  
  // التعامل مع الأرقام العشرية (للدولار)
  if (cleanedPrice.includes('.')) {
    // إذا كان رقم عشري صغير (مثلاً $20.5)، قد يكون بالدولار - نحوله للدينار العراقي (تقريباً)
    const numValue = parseFloat(cleanedPrice);
    if (numValue > 0 && numValue < 100) {
      // تحويل تقريبي للدينار العراقي (سعر صرف تقريبي)
      const estimatedIQD = Math.round(numValue * 1300);
      console.log(`السعر "${price}" تم تحويله من دولار إلى دينار: ${estimatedIQD}`);
      return estimatedIQD.toString();
    }
  }
  
  // إذا وصلنا إلى هنا ولم نعالج القيمة، نعيد القيمة بعد التنظيف
  return cleanedPrice || '0';
}

/**
 * حساب نتيجة الثقة في البيانات المستخرجة
 */
export function calculateConfidenceScore(data: any): number {
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
      // للكود، نتحقق من أنه رقم فعلًا
      if (field === 'code') {
        if (/^\d+$/.test(data[field].toString())) {
          score += weights[field];
        } else {
          score += weights[field] * 0.5; // نصف الدرجة إذا كان الكود غير رقمي
        }
      } 
      // لرقم الهاتف، نتحقق من أنه بالتنسيق الصحيح
      else if (field === 'phoneNumber') {
        if (/^(\+?964|0)7\d{8,9}$/.test(data[field].toString().replace(/\D/g, ''))) {
          score += weights[field];
        } else {
          score += weights[field] * 0.5; // نصف الدرجة إذا كان رقم الهاتف بتنسيق غير صحيح
        }
      } 
      // للسعر، نتحقق من أنه رقم
      else if (field === 'price') {
        if (/^\d+(\.\d+)?$/.test(data[field].toString().replace(/[^\d.]/g, ''))) {
          score += weights[field];
        } else {
          score += weights[field] * 0.5; // نصف الدرجة إذا كان السعر بتنسيق غير صحيح
        }
      } 
      // للحقول النصية، نتحقق من أنها ليست قصيرة جدًا
      else {
        if (data[field].toString().length > 2) {
          score += weights[field];
        } else {
          score += weights[field] * 0.7; // 70% من الدرجة إذا كان النص قصيرًا
        }
      }
    }
  }
  
  return Math.min(Math.round(score), 100);
}

// Utility to check if a blob URL is valid
export const isValidBlobUrl = async (url: string): Promise<boolean> => {
  if (!url || !url.startsWith('blob:')) return false;
  
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error("Error validating blob URL:", url, error);
    return false;
  }
};

// Function to create a more reliable blob URL from a file
export const createReliableBlobUrl = (file: File): string => {
  try {
    // Revoke any existing blob URL first to prevent memory leaks
    const url = URL.createObjectURL(file);
    console.log("Created reliable blob URL:", url);
    return url;
  } catch (error) {
    console.error("Error creating blob URL:", error);
    return '';
  }
};
