
import { format, parseISO, isValid } from 'date-fns';
import { ar } from 'date-fns/locale';

/**
 * تنسيق التاريخ بالصيغة العربية
 * @param dateString سلسلة التاريخ أو كائن Date
 * @param formatPattern نمط التنسيق (اختياري)
 */
export const formatDate = (dateString?: string | Date | null, formatPattern: string = 'PPP'): string => {
  if (!dateString) return '-';
  
  try {
    // محاولة تحليل التاريخ
    let date: Date;
    
    if (dateString instanceof Date) {
      date = dateString;
    } else {
      date = parseISO(dateString);
    }
    
    if (!isValid(date)) {
      return typeof dateString === 'string' ? dateString : '-';
    }
    
    // تنسيق التاريخ باللغة العربية
    return format(date, formatPattern, { locale: ar });
  } catch (error) {
    console.error('خطأ في تنسيق التاريخ:', error);
    return typeof dateString === 'string' ? dateString : '-';
  }
};
