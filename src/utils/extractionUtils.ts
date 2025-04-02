
/**
 * وظائف مساعدة لاستخراج وتنظيف البيانات
 */

// استخراج البيانات تلقائيًا من النص المستخرج
export function autoExtractData(text: string): Record<string, string> {
  if (!text) return {};
  
  const result: Record<string, string> = {};
  
  // استخراج اسم الشركة
  const companyNamePatterns = [
    /شركة\s+([آ-يa-zA-Z\s]{2,}?)(?:\s*(?:للـ|لل|لـ|ل))/i,
    /مؤسسة\s+([آ-يa-zA-Z\s]{2,}?)(?:\s*(?:للـ|لل|لـ|ل))/i,
    /محل\s+([آ-يa-zA-Z\s]{2,}?)(?:\s*(?:للـ|لل|لـ|ل))/i,
    /معرض\s+([آ-يa-zA-Z\s]{2,}?)(?:\s*(?:للـ|لل|لـ|ل))/i,
    /([آ-يa-zA-Z\s]{2,}?)\s+(?:للتجارة|للصناعة|للخدمات|للشحن|للتوصيل)/i,
    /(?:شركة|مؤسسة|محل|معرض)\s+([آ-يa-zA-Z\s]{2,30})/i,
  ];
  
  for (const pattern of companyNamePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.companyName = match[1].trim();
      break;
    }
  }

  // استخراج رقم الكود
  const codePatterns = [
    /(?:كود|رقم|رمز|code|#)[\s:]*([0-9a-zA-Z-]{2,})/i,
    /(?:رقم[\s:]الوصل|رقم الإيصال|رقم[\s:]الفاتورة|رقم[\s:]الطلب)[\s:]*([0-9a-zA-Z-]{2,})/i,
    /(?:وصل رقم|إيصال رقم|فاتورة رقم|طلب رقم)[\s:]*([0-9a-zA-Z-]{2,})/i,
    /(?:رقم العملية|رقم المعاملة|رقم الشحنة)[\s:]*([0-9a-zA-Z-]{2,})/i,
    /(?:SHIPMENT|ORDER|INVOICE)[\s#:]*([0-9a-zA-Z-]{2,})/i,
    /(?:[A-Z]{2,})(\d{3,})/
  ];
  
  for (const pattern of codePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.code = match[1].trim();
      break;
    }
  }

  // استخراج اسم المرسل
  const senderNamePatterns = [
    /(?:اسم[\s:]المرسل|اسم[\s:]العميل|اسم[\s:]الزبون|اسم[\s:]المستلم|اسم[\s:]الشخص)[\s:]*([آ-يa-zA-Z\s]{3,}?)(?:\s*[\n\r]|$|\.|،|,)/i,
    /(?:المرسل|العميل|الزبون|المستلم)[\s:]*([آ-يa-zA-Z\s]{3,}?)(?:\s*[\n\r]|$|\.|،|,)/i,
    /(?:السيد|السيدة)[\s:]*([آ-يa-zA-Z\s]{3,}?)(?:\s*[\n\r]|$|\.|،|,)/i,
    /(?:CUSTOMER|SENDER|CLIENT|RECIPIENT)[\s:]*([آ-يa-zA-Z\s]{3,}?)(?:\s*[\n\r]|$|\.|،|,)/i,
  ];
  
  for (const pattern of senderNamePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.senderName = match[1].trim();
      break;
    }
  }

  // استخراج رقم الهاتف
  const phonePatterns = [
    /(?:هاتف|تلفون|موبايل|الهاتف|تليفون|جوال|رقم|الرقم|phone|tel|mobile)[\s:]*(?:0)?([0-9٠-٩]{10,})/i,
    /(?:07|٠٧)[0-9٠-٩]{8,9}/,
    /[+]?9647[0-9]{8,9}/,
    /(?<!\d)(?:07|٠٧)\d{8,9}(?!\d)/,
  ];
  
  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.phoneNumber = match[1].trim().replace(/[٠-٩]/g, d => String(parseInt(d, 10)));
      // تأكد من أن الرقم يبدأ بـ 07
      if (result.phoneNumber && !result.phoneNumber.startsWith('07') && result.phoneNumber.length >= 9) {
        result.phoneNumber = '07' + result.phoneNumber;
      }
      break;
    }
  }

  // إذا لم نجد رقم هاتف عبر الأنماط، نحاول مباشرة البحث عن أرقام 11 خانة
  if (!result.phoneNumber) {
    const directPhoneMatch = text.match(/(?<!\d)(07\d{9})(?!\d)/);
    if (directPhoneMatch && directPhoneMatch[1]) {
      result.phoneNumber = directPhoneMatch[1];
    }
  }

  // استخراج المحافظة
  const provinces = [
    'بغداد', 'البصرة', 'نينوى', 'أربيل', 'اربيل', 'النجف', 'كربلاء',
    'كركوك', 'الأنبار', 'الانبار', 'بابل', 'ديالى', 'ذي قار', 'ذي كار', 'ذيقار',
    'ديوانية', 'القادسية', 'السليمانية', 'صلاح الدين', 'واسط', 'ميسان',
    'المثنى', 'دهوك', 'حلبجة', 'كردستان'
  ];
  
  for (const province of provinces) {
    if (text.includes(province)) {
      result.province = province;
      break;
    }
  }

  // استخراج السعر
  const pricePatterns = [
    /(?:السعر|المبلغ|الإجمالي|الاجمالي|المجموع|القيمة|الكلفة|الكلي|الكلية|total|price|amount)[\s:]*(?:(?:د\.ع|IQD|دينار|د)?[\s:]*)([0-9٠-٩,،٫.]{1,})/i,
    /([0-9٠-٩,،٫.]{1,})[\s]*(?:د\.ع|IQD|دينار|د)/i,
  ];
  
  for (const pattern of pricePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      let priceText = match[1].trim();
      
      // تنظيف السعر
      priceText = priceText.replace(/[,،٫.]/g, ''); // إزالة الفواصل والنقاط
      priceText = priceText.replace(/[٠-٩]/g, d => String(parseInt(d, 10))); // تحويل الأرقام العربية إلى لاتينية
      
      result.price = priceText;
      break;
    }
  }

  return result;
}

// دمج بيانات من مصادر مختلفة
export function mergeExtractedData(primary: Record<string, string>, secondary: Record<string, string>): Record<string, string> {
  const result = { ...primary };
  
  // استكمال أي حقول مفقودة من المصدر الثانوي
  for (const key in secondary) {
    if (!result[key] || result[key] === '') {
      result[key] = secondary[key];
    }
  }
  
  return result;
}

// التحقق من صحة البيانات المستخرجة
export function validateExtractedData(data: Record<string, string>): Record<string, boolean> {
  const validationResults: Record<string, boolean> = {};
  
  // التحقق من رقم الهاتف
  if (data.phoneNumber) {
    const phonePattern = /^07\d{9}$/;
    validationResults.validPhone = phonePattern.test(data.phoneNumber);
  } else {
    validationResults.validPhone = false;
  }
  
  // التحقق من السعر
  if (data.price) {
    validationResults.validPrice = /^\d+$/.test(data.price.replace(/,/g, ''));
  } else {
    validationResults.validPrice = false;
  }
  
  // التحقق من المحافظة
  if (data.province) {
    const provinces = [
      'بغداد', 'البصرة', 'نينوى', 'أربيل', 'اربيل', 'النجف', 'كربلاء',
      'كركوك', 'الأنبار', 'الانبار', 'بابل', 'ديالى', 'ذي قار', 'ذيقار',
      'ديوانية', 'القادسية', 'السليمانية', 'صلاح الدين', 'واسط', 'ميسان',
      'المثنى', 'دهوك', 'حلبجة', 'كردستان'
    ];
    validationResults.validProvince = provinces.some(p => 
      data.province.includes(p) || p.includes(data.province)
    );
  } else {
    validationResults.validProvince = false;
  }
  
  return validationResults;
}

// حساب درجة الثقة في البيانات المستخرجة
export function calculateDataConfidence(data: Record<string, string>): number {
  let score = 0;
  let totalWeight = 0;
  
  // الأوزان النسبية لمختلف الحقول
  const weights = {
    companyName: 15,
    code: 25,
    senderName: 20,
    phoneNumber: 20,
    province: 10,
    price: 10
  };
  
  // حساب النتيجة بناءً على وجود البيانات
  for (const [field, weight] of Object.entries(weights)) {
    totalWeight += weight;
    
    if (data[field]) {
      const value = data[field].trim();
      
      if (value.length > 0) {
        // إذا كان الحقل غير فارغ، أضف النقاط الكاملة
        score += weight;
        
        // تحقق إضافي للجودة
        if (field === 'phoneNumber') {
          // التحقق من صحة رقم الهاتف
          if (/^07\d{9}$/.test(value)) {
            score += 5;
          } else {
            score -= 5;
          }
        } else if (field === 'code') {
          // التحقق من أن الكود ليس قصيرًا جدًا
          if (value.length < 3) {
            score -= 5;
          }
        } else if (field === 'price') {
          // التحقق من أن السعر عبارة عن أرقام فقط
          if (!/^\d+$/.test(value.replace(/,/g, ''))) {
            score -= 3;
          }
        }
      }
    }
  }
  
  // حساب النسبة المئوية
  let percentage = Math.round((score / totalWeight) * 100);
  
  // تأكد من أن النتيجة ضمن النطاق [0, 100]
  percentage = Math.max(0, Math.min(100, percentage));
  
  return percentage;
}

// تنظيف وتصحيح البيانات المستخرجة
export function cleanExtractedData(data: Record<string, string>): Record<string, string> {
  const cleaned: Record<string, string> = { ...data };
  
  // تنظيف وتصحيح رقم الهاتف
  if (cleaned.phoneNumber) {
    // إزالة المسافات والأحرف الخاصة
    cleaned.phoneNumber = cleaned.phoneNumber.replace(/\s+|-|\(|\)|\+/g, '');
    
    // تحويل الأرقام العربية إلى لاتينية
    cleaned.phoneNumber = cleaned.phoneNumber.replace(/[٠-٩]/g, d => String(parseInt(d, 10)));
    
    // إضافة 0 في البداية إذا كان يبدأ بـ 7 وطوله 10 أرقام
    if (cleaned.phoneNumber.startsWith('7') && cleaned.phoneNumber.length === 10) {
      cleaned.phoneNumber = '0' + cleaned.phoneNumber;
    }
    
    // التعامل مع الأرقام التي تبدأ بـ 964 (رمز الدولة للعراق)
    if (cleaned.phoneNumber.startsWith('964')) {
      cleaned.phoneNumber = cleaned.phoneNumber.replace(/^964/, '0');
    }
    
    // تقليم الرقم إلى 11 رقم إذا كان أطول
    if (cleaned.phoneNumber.length > 11) {
      // التأكد من أن الـ 11 رقم الأولى تبدأ بـ 07
      if (cleaned.phoneNumber.startsWith('07')) {
        cleaned.phoneNumber = cleaned.phoneNumber.substring(0, 11);
      }
    }
  }
  
  // تنظيف وتصحيح السعر
  if (cleaned.price) {
    // إزالة كل شيء ما عدا الأرقام
    cleaned.price = cleaned.price.replace(/[^\d]/g, '');
    
    // التأكد من أن السعر ليس فارغًا أو صفرًا
    if (!cleaned.price || cleaned.price === '0') {
      cleaned.price = '';
    }
  }
  
  // تنظيف المحافظة
  if (cleaned.province) {
    const provinces = [
      'بغداد', 'البصرة', 'نينوى', 'أربيل', 'اربيل', 'النجف', 'كربلاء',
      'كركوك', 'الأنبار', 'الانبار', 'بابل', 'ديالى', 'ذي قار', 'ذيقار',
      'ديوانية', 'القادسية', 'السليمانية', 'صلاح الدين', 'واسط', 'ميسان',
      'المثنى', 'دهوك', 'حلبجة', 'كردستان'
    ];
    
    // البحث عن أقرب تطابق
    for (const province of provinces) {
      if (cleaned.province.includes(province) || province.includes(cleaned.province)) {
        cleaned.province = province;
        break;
      }
    }
  }
  
  return cleaned;
}
