
import { useCallback } from "react";

/**
 * هوك لإنشاء عناوين URL آمنة للصور مع التعامل مع مشاكل CORS وأمان blob URLs
 */
export const useCreateSafeObjectUrl = () => {
  /**
   * إنشاء عنوان URL آمن للصورة
   * يستخدم Data URL بدلاً من blob URL لتفادي مشاكل الأمان والذاكرة
   */
  const createSafeObjectURL = useCallback((file: File): string => {
    // تنفيذ افتراضي: استخدام FileReader لتحويل الصورة إلى Data URL مباشرة
    // هذا يتجنب مشاكل CORS والأمان المرتبطة بـ blob URLs
    return new Promise((resolve) => {
      try {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = (error) => {
          console.error("خطأ في قراءة الملف:", error);
          // إرجاع قيمة فارغة في حالة الخطأ
          resolve("");
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("خطأ في إنشاء عنوان URL للصورة:", error);
        // محاولة استخدام URL.createObjectURL كخطة بديلة
        try {
          resolve(URL.createObjectURL(file));
        } catch (objectUrlError) {
          console.error("فشل في إنشاء object URL:", objectUrlError);
          resolve("");
        }
      }
    }) as unknown as string;
  }, []);

  /**
   * تحرير موارد عنوان URL عندما لم يعد مطلوبًا
   */
  const revokeObjectURL = useCallback((url: string) => {
    // التحقق من نوع العنوان قبل المحاولة بإلغائه
    if (url && url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("خطأ في تحرير عنوان URL:", error);
      }
    }
    // لا نحتاج لتحرير Data URLs لأنها تتم معالجتها بواسطة جامع القمامة
  }, []);

  return {
    createSafeObjectURL,
    revokeObjectURL
  };
};
