
import { useCallback, useRef } from "react";

export const useCreateSafeObjectUrl = () => {
  // حفظ عناوين URL التي تم إنشاؤها للتنظيف لاحقًا
  const createdUrls = useRef<string[]>([]);

  // إنشاء عنوان URL آمن للصور
  const createSafeObjectURL = useCallback(async (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      // استخدام FileReader لتحويل الملف إلى Data URL
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // تخزين العنوان للتنظيف لاحقًا
          createdUrls.current.push(reader.result);
          resolve(reader.result);
        } else {
          reject(new Error('فشل في تحويل الملف إلى عنوان Data URL'));
        }
      };
      reader.onerror = (error) => {
        console.error('فشل في قراءة الملف:', error);
        reject(error);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  // إبطال عنوان URL
  const revokeObjectURL = useCallback((url: string) => {
    // تحقق مما إذا كان العنوان من نوع "blob:" URL
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
      // إزالة العنوان من القائمة
      createdUrls.current = createdUrls.current.filter(u => u !== url);
    }
  }, []);

  // إبطال جميع عناوين URL
  const revokeAllObjectURLs = useCallback(() => {
    createdUrls.current.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    createdUrls.current = [];
  }, []);

  return { createSafeObjectURL, revokeObjectURL, revokeAllObjectURLs };
};
