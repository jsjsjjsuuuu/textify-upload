
import { format, parseISO, isValid } from 'date-fns';
import { ar } from 'date-fns/locale';

/**
 * تنسيق التاريخ بالصيغة العربية
 * @param dateString سلسلة التاريخ
 * @param formatPattern نمط التنسيق (اختياري)
 */
export const formatDate = (dateString?: string | null, formatPattern: string = 'PPP'): string => {
  if (!dateString) return '-';
  
  try {
    // محاولة تحليل التاريخ
    const date = parseISO(dateString);
    
    if (!isValid(date)) {
      return dateString; // إرجاع القيمة الأصلية إذا كانت التاريخ غير صالح
    }
    
    // تنسيق التاريخ باللغة العربية
    return format(date, formatPattern, { locale: ar });
  } catch (error) {
    console.error('خطأ في تنسيق التاريخ:', error);
    return dateString;
  }
};
