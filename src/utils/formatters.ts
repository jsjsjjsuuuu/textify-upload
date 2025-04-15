
/**
 * وظائف تنسيق عامة
 */

/**
 * تنسيق التاريخ إلى صيغة محلية
 * @param date التاريخ المراد تنسيقه
 * @returns التاريخ بتنسيق محلي
 */
export const formatDate = (date: Date): string => {
  if (!date || !(date instanceof Date)) {
    return 'غير محدد';
  }
  
  try {
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    console.error('خطأ في تنسيق التاريخ:', error);
    return date.toLocaleString('ar-EG');
  }
};

/**
 * تنسيق الحجم إلى صيغة سهلة القراءة
 * @param bytes الحجم بالبايت
 * @returns الحجم بتنسيق سهل القراءة
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) {
    return bytes + ' بايت';
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + ' كيلوبايت';
  } else {
    return (bytes / (1024 * 1024)).toFixed(1) + ' ميجابايت';
  }
};

/**
 * تنسيق حجم الملف بوحدات مناسبة (بايت، كيلوبايت، ميجابايت)
 * @param bytes حجم الملف بالبايت
 * @returns النص المنسق
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 بايت';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت', 'تيرابايت'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * تنسيق رقم الهاتف للعرض
 * @param phone رقم الهاتف
 * @returns رقم الهاتف بتنسيق سهل القراءة
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // إزالة الأحرف غير الرقمية
  const numbersOnly = phone.replace(/\D/g, '');
  
  // التحقق من أن الرقم مصري (11 رقم)
  if (numbersOnly.length !== 11) {
    return phone; // إرجاع النص الأصلي إذا لم يكن بالتنسيق المتوقع
  }
  
  // تنسيق على الشكل 01x xxxx xxxx
  return `${numbersOnly.substring(0, 3)} ${numbersOnly.substring(3, 7)} ${numbersOnly.substring(7, 11)}`;
};

/**
 * تنسيق نسبة مئوية
 * @param value قيمة بين 0 و 1
 * @returns النسبة المئوية مع علامة %
 */
export const formatPercent = (value: number): string => {
  if (isNaN(value)) return '0%';
  return Math.round(value * 100) + '%';
};
