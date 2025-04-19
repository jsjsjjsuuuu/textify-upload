
/**
 * وظائف للتعامل مع الصور وإنشاء عناوين URL آمنة
 */

/**
 * إنشاء عنوان URL آمن للصورة باستخدام Data URL بدلاً من blob URL
 * @param file ملف الصورة أو blob
 * @returns وعد يحتوي على عنوان URL للصورة
 */
export const createSafeObjectURL = async (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    // استخدام FileReader لتحويل الملف إلى Data URL
    const reader = new FileReader();
    
    // تعيين معالج حدث نجاح التحميل
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('فشل في تحويل الصورة إلى Data URL'));
      }
    };
    
    // تعيين معالج حدث الخطأ
    reader.onerror = (error) => {
      console.error('خطأ في قراءة الصورة:', error);
      reject(error);
    };
    
    // بدء قراءة الملف كـ Data URL
    reader.readAsDataURL(file);
  });
};

/**
 * دالة مساعدة لتحويل blob URL إلى Data URL
 * مفيدة عندما نحتاج إلى تحويل blob URLs من مصادر خارجية
 */
export const blobUrlToDataUrl = async (blobUrl: string): Promise<string> => {
  try {
    // جلب البيانات من blob URL
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    
    // تحويل blob إلى Data URL
    return await createSafeObjectURL(blob);
  } catch (error) {
    console.error('خطأ في تحويل blob URL إلى Data URL:', error);
    throw error;
  }
};

/**
 * دالة للتحقق مما إذا كان عنوان URL عبارة عن عنوان Data URL
 */
export const isDataUrl = (url: string): boolean => {
  return url.startsWith('data:');
};

export default createSafeObjectURL;
