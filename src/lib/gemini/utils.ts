
/**
 * وظائف مساعدة للعمل مع Gemini
 */

/**
 * تحويل ملف إلى تنسيق Base64
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

/**
 * تنسيق السعر لإزالة النص غير الضروري وتوحيد التنسيق
 */
export function formatPrice(price: string | number): string {
  if (!price) return '';
  
  let priceStr = String(price);
  
  // إزالة أي نص غير رقمي ماعدا النقطة والفواصل
  priceStr = priceStr.replace(/[^\d.,]/g, '');
  
  // استبدال الفاصلة بنقطة للعشرية
  priceStr = priceStr.replace(/,/g, '.');
  
  // التأكد من وجود نقطة عشرية واحدة فقط
  const parts = priceStr.split('.');
  if (parts.length > 2) {
    priceStr = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // محاولة تحويل السعر إلى رقم وتقريبه إلى رقمين عشريين إذا أمكن
  try {
    const parsedPrice = parseFloat(priceStr);
    if (!isNaN(parsedPrice)) {
      // التحقق من وجود أرقام عشرية
      if (parsedPrice % 1 === 0) {
        // عدد صحيح
        return parsedPrice.toString();
      } else {
        // عدد عشري
        return parsedPrice.toFixed(2);
      }
    }
  } catch (e) {
    // إذا فشل التحويل، استخدم النص الأصلي بعد التنظيف
  }
  
  return priceStr;
}

/**
 * تحليل المبلغ وتحويله إلى قيمة رقمية
 */
export function parseAmount(amount: string): number | null {
  if (!amount) return null;
  
  // إزالة أي نص غير رقمي ماعدا النقطة والفواصل
  const cleanedAmount = amount.replace(/[^\d.,]/g, '');
  
  // استبدال الفاصلة بنقطة للعشرية
  const normalizedAmount = cleanedAmount.replace(/,/g, '.');
  
  // التأكد من وجود نقطة عشرية واحدة فقط
  const parts = normalizedAmount.split('.');
  const finalAmount = parts.length > 2 
    ? parts[0] + '.' + parts.slice(1).join('') 
    : normalizedAmount;
  
  // محاولة تحويل المبلغ إلى رقم
  const parsedAmount = parseFloat(finalAmount);
  
  return isNaN(parsedAmount) ? null : parsedAmount;
}

/**
 * إنشاء إشارة مهلة مع وقت محدد
 */
export function createTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}
