
/**
 * وظائف مساعدة لـ Gemini API
 */

/**
 * تحويل ملف إلى Base64
 * @param file الملف المراد تحويله
 * @returns وعد بسلسلة Base64
 */
export const fileToBase64 = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // استخراج Base64 فقط (بدون header)
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => {
      reject(error);
    };
  });
};

/**
 * إنشاء BlobURL موثوق
 * @param blob الملف أو Blob المراد تحويله
 * @returns وعد بعنوان URL
 */
export const createReliableBlobUrl = (blob: Blob | File): Promise<string> => {
  return new Promise((resolve) => {
    try {
      // أولاً نحاول إنشاء عنوان URL للكائن
      const blobUrl = URL.createObjectURL(blob);
      resolve(blobUrl);
    } catch (error) {
      console.error("خطأ في إنشاء URL للكائن:", error);
      
      // إذا فشل ذلك، نستخدم Data URL
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => {
        console.error("خطأ في قراءة الملف، إرجاع قيمة فارغة");
        resolve("");
      };
      reader.readAsDataURL(blob);
    }
  });
};

/**
 * تنسيق السعر للعرض
 * @param price السعر كرقم أو سلسلة
 * @returns السعر المنسق كسلسلة
 */
export const formatPrice = (price: string | number): string => {
  if (!price) return "";
  
  // تحويل السعر إلى رقم إذا كان سلسلة
  let numPrice: number;
  if (typeof price === 'string') {
    // إزالة أي حروف غير رقمية باستثناء النقطة العشرية
    const cleanedPrice = price.replace(/[^\d.-]/g, '');
    numPrice = parseFloat(cleanedPrice);
  } else {
    numPrice = price;
  }
  
  // التحقق من أن السعر رقم صالح
  if (isNaN(numPrice)) return price.toString();
  
  // تنسيق السعر بالفواصل
  return numPrice.toLocaleString('ar-IQ');
};
