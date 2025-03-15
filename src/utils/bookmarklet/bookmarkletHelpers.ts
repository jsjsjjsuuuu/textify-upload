
// وظائف مساعدة للبوكماركلت مخصصة للمواقع العراقية

/**
 * تنسيق رقم الهاتف العراقي وتصحيحه
 * @param phoneNumber رقم الهاتف
 * @returns رقم الهاتف المنسق
 */
export const formatIraqiPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return '';
  
  // إزالة كل شيء ما عدا الأرقام
  const digitsOnly = phoneNumber.replace(/[^\d]/g, '');
  
  // تحقق من أنماط الأرقام العراقية المختلفة وتنسيقها
  if (digitsOnly.length === 10 && digitsOnly.startsWith('7')) {
    return '0' + digitsOnly; // إضافة الصفر في البداية
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('07')) {
    return digitsOnly; // الحفاظ على الرقم كما هو لأنه منسق بشكل صحيح
  } else if (digitsOnly.length === 13 && digitsOnly.startsWith('9647')) {
    return '0' + digitsOnly.substring(3); // تحويل الرقم الدولي إلى محلي
  } else if (digitsOnly.length === 14 && digitsOnly.startsWith('00964')) {
    return '0' + digitsOnly.substring(5); // تحويل الرقم الدولي بصيغة 00 إلى محلي
  } else if (digitsOnly.length === 9 && !digitsOnly.startsWith('0')) {
    // إذا كان الرقم مكون من 9 أرقام بدون صفر في البداية، أضف صفر في البداية
    return '0' + digitsOnly;
  }
  
  // للأرقام التي تبدو غير عراقية، حاول إجراء أفضل تخمين
  if (digitsOnly.length > 0 && !digitsOnly.startsWith('0')) {
    return '0' + digitsOnly; // إضافة صفر في البداية
  }
  
  return phoneNumber; // إرجاع الرقم كما هو إذا لم يطابق أي صيغة
};

/**
 * تنسيق المبالغ للاستخدام في حقول الإدخال
 * @param price المبلغ كنص
 * @returns المبلغ المنسق كرقم
 */
export const formatPrice = (price: string): string => {
  if (!price) return '0';
  
  // التعامل مع القيم النصية الخاصة
  if (price.toLowerCase() === 'مجاني' || price.toLowerCase() === 'free' || 
      price.toLowerCase() === 'واصل' || price.toLowerCase() === 'توصيل') {
    return '0';
  }
  
  // إزالة كل شيء عدا الأرقام والعلامة العشرية
  const numericValue = price.replace(/[^\d.]/g, '');
  
  // التحقق من وجود قيمة صالحة
  if (!numericValue || isNaN(Number(numericValue))) {
    return '0';
  }
  
  return numericValue;
};

/**
 * تنظيف وتنسيق نص الكود العراقي
 * @param code كود الشحنة
 * @returns الكود المنسق
 */
export const formatIraqiCode = (code: string): string => {
  if (!code) return '';
  
  // إزالة المسافات والرموز الخاصة مع الحفاظ على الأرقام والحروف فقط
  const cleanedCode = code.replace(/[^\w\d]/g, '');
  
  return cleanedCode;
};

/**
 * اكتشاف وصحح اسم المحافظة العراقية
 * @param provinceName اسم المحافظة
 * @returns اسم المحافظة المصحح
 */
export const correctIraqiProvinceName = (provinceName: string): string => {
  if (!provinceName) return '';
  
  const normalizedName = provinceName.trim().toLowerCase();
  
  // قائمة المحافظات العراقية باللغة العربية
  const provinceMap: Record<string, string> = {
    'بغداد': 'بغداد',
    'البصرة': 'البصرة',
    'نينوى': 'نينوى',
    'أربيل': 'أربيل',
    'النجف': 'النجف',
    'كربلاء': 'كربلاء',
    'ذي قار': 'ذي قار',
    'الأنبار': 'الأنبار',
    'ديالى': 'ديالى',
    'كركوك': 'كركوك',
    'صلاح الدين': 'صلاح الدين',
    'بابل': 'بابل',
    'المثنى': 'المثنى',
    'القادسية': 'القادسية',
    'واسط': 'واسط',
    'ميسان': 'ميسان',
    'دهوك': 'دهوك',
    'السليمانية': 'السليمانية'
  };
  
  // قائمة التصحيحات للأخطاء الشائعة
  const corrections: Record<string, string> = {
    'بغدات': 'بغداد',
    'بقداد': 'بغداد',
    'baghdad': 'بغداد',
    'بصرة': 'البصرة',
    'البصره': 'البصرة',
    'basra': 'البصرة',
    'موصل': 'نينوى',
    'الموصل': 'نينوى',
    'نينوه': 'نينوى',
    'اربيل': 'أربيل',
    'erbil': 'أربيل',
    'نجف': 'النجف',
    'كربلا': 'كربلاء',
    'الناصرية': 'ذي قار',
    'ذيقار': 'ذي قار',
    'ذى قار': 'ذي قار',
    'انبار': 'الأنبار',
    'الانبار': 'الأنبار',
    'الرمادي': 'الأنبار',
    'ديالا': 'ديالى',
    'بعقوبة': 'ديالى',
    'التأميم': 'كركوك',
    'صلاحدين': 'صلاح الدين',
    'صلاح دين': 'صلاح الدين',
    'تكريت': 'صلاح الدين',
    'الحلة': 'بابل',
    'babylon': 'بابل',
    'السماوة': 'المثنى',
    'مثنى': 'المثنى',
    'الديوانية': 'القادسية',
    'قادسية': 'القادسية',
    'الكوت': 'واسط',
    'kut': 'واسط',
    'العمارة': 'ميسان',
    'دهوق': 'دهوك',
    'سليمانية': 'السليمانية',
    'سلیمانیة': 'السليمانية'
  };
  
  // البحث في التصحيحات أولاً
  for (const [wrongName, correctName] of Object.entries(corrections)) {
    if (normalizedName.includes(wrongName.toLowerCase())) {
      return correctName;
    }
  }
  
  // البحث في أسماء المحافظات
  for (const [name, correctName] of Object.entries(provinceMap)) {
    if (normalizedName.includes(name.toLowerCase())) {
      return correctName;
    }
  }
  
  // إذا لم يتم العثور على تطابق، إرجاع الاسم الأصلي
  return provinceName;
};

/**
 * تحقق مما إذا كان النص يحتوي على محافظة عراقية
 * @param text النص للبحث فيه
 * @returns اسم المحافظة إذا وجدت، وإلا فارغ
 */
export const extractIraqiProvince = (text: string): string => {
  if (!text) return '';
  
  const normalizedText = text.toLowerCase();
  
  // قائمة المحافظات والأسماء البديلة التي يجب البحث عنها
  const provincesWithAlternatives = [
    { province: 'بغداد', alternatives: ['بغداد', 'بغدات', 'بقداد', 'baghdad'] },
    { province: 'البصرة', alternatives: ['البصرة', 'بصرة', 'البصره', 'basra'] },
    { province: 'نينوى', alternatives: ['نينوى', 'موصل', 'الموصل', 'نينوه', 'mosul'] },
    { province: 'أربيل', alternatives: ['أربيل', 'اربيل', 'erbil'] },
    { province: 'النجف', alternatives: ['النجف', 'نجف', 'najaf'] },
    { province: 'كربلاء', alternatives: ['كربلاء', 'كربلا', 'karbala'] },
    { province: 'ذي قار', alternatives: ['ذي قار', 'ذيقار', 'ذى قار', 'الناصرية'] },
    { province: 'الأنبار', alternatives: ['الأنبار', 'انبار', 'الانبار', 'الرمادي'] },
    { province: 'ديالى', alternatives: ['ديالى', 'ديالا', 'بعقوبة'] },
    { province: 'كركوك', alternatives: ['كركوك', 'التأميم'] },
    { province: 'صلاح الدين', alternatives: ['صلاح الدين', 'صلاحدين', 'صلاح دين', 'تكريت'] },
    { province: 'بابل', alternatives: ['بابل', 'الحلة', 'babylon'] },
    { province: 'المثنى', alternatives: ['المثنى', 'مثنى', 'السماوة'] },
    { province: 'القادسية', alternatives: ['القادسية', 'قادسية', 'الديوانية'] },
    { province: 'واسط', alternatives: ['واسط', 'الكوت', 'kut'] },
    { province: 'ميسان', alternatives: ['ميسان', 'العمارة'] },
    { province: 'دهوك', alternatives: ['دهوك', 'دهوق'] },
    { province: 'السليمانية', alternatives: ['السليمانية', 'سليمانية', 'سلیمانیة'] }
  ];
  
  // البحث عن أسماء المحافظات وبدائلها في النص
  for (const { province, alternatives } of provincesWithAlternatives) {
    for (const alt of alternatives) {
      if (normalizedText.includes(alt.toLowerCase())) {
        return province;
      }
    }
  }
  
  return '';
};

/**
 * استخراج رقم هاتف عراقي من نص
 * @param text النص الذي قد يحتوي على رقم هاتف
 * @returns رقم الهاتف المستخرج أو فارغ
 */
export const extractIraqiPhoneNumber = (text: string): string => {
  if (!text) return '';
  
  // أنماط أرقام الهواتف العراقية
  const iraqiPhonePatterns = [
    /\b(07\d{9})\b/g, // 11 رقم مع الصفر
    /\b(7\d{9})\b/g,  // 10 أرقام بدون الصفر
    /\b(\+964\s?7\d{9})\b/g, // مع رمز الدولة +964
    /\b(00964\s?7\d{9})\b/g, // مع رمز الدولة 00964
    /\b(964\s?7\d{9})\b/g    // مع رمز الدولة 964
  ];
  
  // البحث عن كل أنماط الهواتف في النص
  for (const pattern of iraqiPhonePatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      // تنسيق الرقم المستخرج
      return formatIraqiPhoneNumber(matches[0]);
    }
  }
  
  return '';
};

/**
 * استخراج سعر (مبلغ مالي) من نص
 * @param text النص الذي قد يحتوي على سعر
 * @returns السعر المستخرج أو فارغ
 */
export const extractPrice = (text: string): string => {
  if (!text) return '';
  
  // البحث عن أنماط الأسعار العراقية
  // مثال: 25,000 أو 25000 أو 25.000 دينار
  const pricePatterns = [
    /\b(\d{1,3}(?:,\d{3})+(?:\.\d+)?)\b/g, // أرقام مع فواصل
    /\b(\d+(?:\.\d+)?)\s*(?:دينار|دولار|$|\$)\b/g, // أرقام متبوعة بـ "دينار" أو "دولار" أو $
    /\b(\d+)\b/g // أي رقم كبديل أخير
  ];
  
  // البحث عن الأنماط بالترتيب
  for (const pattern of pricePatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      // تنظيف السعر المستخرج
      return formatPrice(matches[0]);
    }
  }
  
  return '';
};

/**
 * فحص ما إذا كان رقم الهاتف العراقي صالحًا
 * @param phoneNumber رقم الهاتف للتحقق
 * @returns true إذا كان رقم الهاتف صالحًا
 */
export const isValidIraqiPhoneNumber = (phoneNumber: string): boolean => {
  if (!phoneNumber) return false;
  
  // تنظيف الرقم
  const digitsOnly = phoneNumber.replace(/[^\d]/g, '');
  
  // التحقق من صحة رقم الهاتف العراقي
  if (digitsOnly.length === 11 && digitsOnly.startsWith('07')) {
    // رقم عراقي محلي صحيح
    return true;
  } else if (digitsOnly.length === 13 && digitsOnly.startsWith('9647')) {
    // رقم عراقي دولي صحيح
    return true;
  } else if (digitsOnly.length === 14 && digitsOnly.startsWith('00964')) {
    // رقم عراقي دولي صحيح بصيغة 00
    return true;
  }
  
  return false;
};

/**
 * تشخيص أخطاء البوكماركلت وإعادة بيانات تفصيلية
 * @returns بيانات التشخيص
 */
export const diagnoseBookmarklet = (): Record<string, any> => {
  const diagnosis = {
    userAgent: navigator.userAgent,
    url: window.location.href,
    pageTitle: document.title,
    forms: document.forms.length,
    inputs: document.querySelectorAll('input').length,
    selects: document.querySelectorAll('select').length,
    textareas: document.querySelectorAll('textarea').length,
    buttons: document.querySelectorAll('button').length,
    iframes: document.querySelectorAll('iframe').length,
    formData: [] as any[]
  };
  
  // جمع معلومات عن النماذج الموجودة
  for (let i = 0; i < document.forms.length; i++) {
    const form = document.forms[i];
    const formElements = Array.from(form.elements).map(el => {
      const element = el as HTMLInputElement;
      return {
        name: element.name || 'بدون اسم',
        id: element.id || 'بدون معرف',
        type: element.type || element.tagName.toLowerCase(),
        value: element.value || '(فارغ)'
      };
    });
    
    diagnosis.formData.push({
      formIndex: i,
      formId: form.id || 'بدون معرف',
      formAction: form.action || 'بدون إجراء',
      formMethod: form.method || 'get',
      elements: formElements
    });
  }
  
  return diagnosis;
};
