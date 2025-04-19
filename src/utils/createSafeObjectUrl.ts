
/**
 * وظائف للتعامل مع الصور وإنشاء عناوين URL آمنة
 */

const MAX_RETRIES = 3;
const TIMEOUT_MS = 30000; // 30 ثانية

/**
 * إنشاء عنوان URL آمن للصورة
 */
export const createSafeObjectURL = async (file: File | Blob, retryCount = 0): Promise<string> => {
  if (!file) {
    console.error('خطأ: الملف غير موجود');
    throw new Error('الملف غير موجود');
  }

  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      
      // تعيين مهلة زمنية للقراءة
      const timeout = setTimeout(() => {
        reader.abort();
        console.error('انتهت مهلة القراءة');
        
        // محاولة إعادة المحاولة إذا لم نصل للحد الأقصى
        if (retryCount < MAX_RETRIES) {
          console.log(`محاولة إعادة القراءة ${retryCount + 1} من ${MAX_RETRIES}`);
          createSafeObjectURL(file, retryCount + 1)
            .then(resolve)
            .catch(reject);
        } else {
          reject(new Error('انتهت مهلة قراءة الملف بعد عدة محاولات'));
        }
      }, TIMEOUT_MS);
      
      // نجاح القراءة
      reader.onloadend = () => {
        clearTimeout(timeout);
        if (typeof reader.result === 'string') {
          console.log("تم تحويل الملف إلى Data URL بنجاح");
          resolve(reader.result);
        } else {
          console.error("النتيجة ليست Data URL");
          reject(new Error('فشل في تحويل الملف إلى Data URL'));
        }
      };
      
      // معالجة الخطأ
      reader.onerror = (error) => {
        clearTimeout(timeout);
        console.error('خطأ في قراءة الملف:', error);
        
        // محاولة استخدام URL.createObjectURL كخطة بديلة
        try {
          console.log("محاولة استخدام URL.createObjectURL كخطة بديلة");
          const blobUrl = URL.createObjectURL(file);
          resolve(blobUrl);
        } catch (fallbackError) {
          console.error('فشلت الخطة البديلة:', fallbackError);
          reject(error);
        }
      };
      
      // إلغاء القراءة
      reader.onabort = () => {
        clearTimeout(timeout);
        console.error('تم إلغاء قراءة الملف');
        
        if (retryCount < MAX_RETRIES) {
          console.log(`محاولة إعادة القراءة ${retryCount + 1} من ${MAX_RETRIES}`);
          createSafeObjectURL(file, retryCount + 1)
            .then(resolve)
            .catch(reject);
        } else {
          reject(new Error('تم إلغاء قراءة الملف بعد عدة محاولات'));
        }
      };
      
      console.log("جاري قراءة الملف كـ Data URL...");
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error('خطأ في تحويل الملف:', error);
      
      // محاولة استخدام URL.createObjectURL كخطة بديلة
      try {
        console.log("محاولة استخدام URL.createObjectURL بعد خطأ");
        const blobUrl = URL.createObjectURL(file);
        resolve(blobUrl);
      } catch (fallbackError) {
        console.error('فشلت جميع المحاولات:', fallbackError);
        reject(error);
      }
    }
  });
};

export const blobUrlToDataUrl = async (blobUrl: string): Promise<string> => {
  if (!blobUrl || !blobUrl.startsWith('blob:')) {
    throw new Error('عنوان URL غير صالح');
  }

  try {
    const response = await fetch(blobUrl);
    if (!response.ok) {
      throw new Error(`فشل في جلب البيانات: ${response.status}`);
    }
    
    const blob = await response.blob();
    return await createSafeObjectURL(blob);
  } catch (error) {
    console.error('خطأ في تحويل blob URL إلى Data URL:', error);
    throw error;
  }
};

export const isDataUrl = (url: string): boolean => {
  return url && typeof url === 'string' && url.startsWith('data:');
};

export default createSafeObjectURL;

