
export const useCreateSafeObjectUrl = () => {
  const createSafeObjectURL = async (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // التأكد من أن الملف موجود قبل إنشاء عنوان URL
        if (!file) {
          console.error("خطأ: الملف غير موجود أو غير صالح");
          reject(new Error("الملف غير موجود"));
          return;
        }
        
        // إنشاء عنوان URL للملف باستخدام URL.createObjectURL
        const url = URL.createObjectURL(file);
        console.log("تم إنشاء عنوان URL للصورة بنجاح:", url);
        
        // إنشاء عنصر صورة للتحقق من صحة URL
        const img = new Image();
        img.onload = () => {
          resolve(url);
        };
        img.onerror = () => {
          console.error("تعذر تحميل الصورة من عنوان URL المنشأ");
          URL.revokeObjectURL(url); // إلغاء URL في حالة الخطأ
          reject(new Error("تعذر تحميل الصورة"));
        };
        img.src = url;
        
        // وضع حد زمني للتحميل
        setTimeout(() => {
          if (!img.complete) {
            URL.revokeObjectURL(url);
            console.error("انتهت مهلة تحميل الصورة");
            reject(new Error("انتهت مهلة تحميل الصورة"));
          }
        }, 10000); // 10 ثواني
      } catch (error) {
        console.error("خطأ في إنشاء عنوان URL للملف:", error);
        reject(error);
      }
    });
  };

  // دالة لإلغاء عنوان URL لمنع تسرب الذاكرة
  const revokeObjectURL = (url: string): void => {
    if (url && url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(url);
        console.log("تم إلغاء عنوان URL للصورة");
      } catch (error) {
        console.error("خطأ في إلغاء عنوان URL للصورة:", error);
      }
    } else {
      console.log("عنوان URL غير صالح للإلغاء:", url);
    }
  };

  return {
    createSafeObjectURL,
    revokeObjectURL
  };
};
