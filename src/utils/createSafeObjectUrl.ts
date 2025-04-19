
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
    if (!file) {
      console.error('خطأ: الملف غير موجود');
      reject(new Error('الملف غير موجود'));
      return;
    }

    try {
      // استخدام FileReader لتحويل الملف إلى Data URL
      const reader = new FileReader();
      
      // تعيين مهلة زمنية للقراءة لمنع التجميد
      const timeout = setTimeout(() => {
        console.error('انتهت مهلة القراءة');
        reader.abort();
        reject(new Error('انتهت مهلة قراءة الملف'));
      }, 30000); // 30 ثانية كحد أقصى
      
      // تعيين معالج حدث نجاح التحميل
      reader.onloadend = () => {
        clearTimeout(timeout);
        if (typeof reader.result === 'string') {
          // تأكد من أن النتيجة هي string وليست ArrayBuffer
          console.log("تم تحويل الملف إلى Data URL بنجاح");
          resolve(reader.result);
        } else {
          console.error("النتيجة ليست Data URL");
          reject(new Error('فشل في تحويل الملف إلى Data URL'));
        }
      };
      
      // تعيين معالج حدث الخطأ
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
      
      // تعيين معالج حدث الإلغاء
      reader.onabort = () => {
        clearTimeout(timeout);
        console.error('تم إلغاء قراءة الملف');
        reject(new Error('تم إلغاء قراءة الملف'));
      };
      
      // بدء قراءة الملف كـ Data URL
      console.log("جاري قراءة الملف كـ Data URL...", file.type, file.size);
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

/**
 * دالة مساعدة لتحويل blob URL إلى Data URL
 * مفيدة عندما نحتاج إلى تحويل blob URLs من مصادر خارجية
 */
export const blobUrlToDataUrl = async (blobUrl: string): Promise<string> => {
  try {
    // التحقق من صحة URL
    if (!blobUrl || !blobUrl.startsWith('blob:')) {
      console.error('عنوان URL غير صالح:', blobUrl);
      throw new Error('عنوان URL غير صالح');
    }

    // جلب البيانات من blob URL
    console.log("جاري جلب البيانات من blob URL...");
    const response = await fetch(blobUrl);
    
    if (!response.ok) {
      throw new Error(`فشل في جلب البيانات: ${response.status} ${response.statusText}`);
    }
    
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
  return url && typeof url === 'string' && url.startsWith('data:');
};

/**
 * إنشاء عنوان URL مؤقت من ملف مع التأكد من إلغائه عند عدم الحاجة إليه
 * @param file ملف الصورة أو blob
 * @returns وعد يحتوي على عنوان URL للصورة
 */
export const createTemporaryObjectURL = (file: File | Blob): string => {
  if (!file) {
    throw new Error('الملف غير موجود');
  }
  
  try {
    const url = URL.createObjectURL(file);
    console.log("تم إنشاء عنوان URL مؤقت:", url);
    return url;
  } catch (error) {
    console.error('خطأ في إنشاء عنوان URL مؤقت:', error);
    throw error;
  }
};

/**
 * إلغاء عنوان URL مؤقت لتحرير الذاكرة
 * @param url عنوان URL المؤقت
 */
export const revokeObjectURL = (url: string): void => {
  if (url && url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url);
      console.log("تم إلغاء عنوان URL مؤقت");
    } catch (error) {
      console.error('خطأ في إلغاء عنوان URL مؤقت:', error);
    }
  }
};

export default createSafeObjectURL;
