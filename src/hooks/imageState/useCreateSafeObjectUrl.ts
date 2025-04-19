
import { useCallback } from "react";
import { createSafeObjectURL, blobUrlToDataUrl } from "@/utils/createSafeObjectUrl";

export const useCreateSafeObjectUrl = () => {
  // استخدام وظيفة createSafeObjectURL المحسنة من المرفقات
  const createSafeObjectURLWrapper = useCallback(async (file: File | Blob): Promise<string> => {
    try {
      if (!file) {
        console.error("خطأ: الملف غير موجود أو غير صالح");
        throw new Error("الملف غير موجود");
      }
      
      console.log("جاري إنشاء عنوان URL آمن للصورة...");
      const url = await createSafeObjectURL(file);
      console.log("تم إنشاء عنوان URL بنجاح:", url.substring(0, 50) + "...");
      return url;
    } catch (error) {
      console.error("خطأ في إنشاء عنوان URL للملف:", error);
      throw error;
    }
  }, []);

  // دالة لإلغاء عنوان URL لمنع تسرب الذاكرة
  const revokeObjectURL = useCallback((url: string): void => {
    if (url && url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(url);
        console.log("تم إلغاء عنوان URL للصورة");
      } catch (error) {
        console.error("خطأ في إلغاء عنوان URL للصورة:", error);
      }
    } else {
      console.log("عنوان URL غير قابل للإلغاء (ليس blob URL):", url.substring(0, 30));
    }
  }, []);

  // دالة لتحويل Blob URL إلى Data URL
  const convertBlobToDataUrl = useCallback(async (blobUrl: string): Promise<string> => {
    try {
      console.log("جاري تحويل blob URL إلى data URL...");
      const dataUrl = await blobUrlToDataUrl(blobUrl);
      console.log("تم التحويل بنجاح");
      return dataUrl;
    } catch (error) {
      console.error("خطأ في تحويل blob URL إلى data URL:", error);
      throw error;
    }
  }, []);

  return {
    createSafeObjectURL: createSafeObjectURLWrapper,
    revokeObjectURL,
    convertBlobToDataUrl
  };
};

export default useCreateSafeObjectUrl;
