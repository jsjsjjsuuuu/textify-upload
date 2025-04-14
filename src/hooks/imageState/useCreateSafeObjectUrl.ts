
import { useState, useCallback, useEffect } from "react";

/**
 * هوك لإنشاء وإدارة عناوين URL آمنة للصور
 * يحول الملفات إلى عناوين URL ويقوم بإلغاء هذه العناوين عند عدم الحاجة إليها
 */
export const useCreateSafeObjectUrl = () => {
  // تخزين قائمة عناوين URL التي تم إنشاؤها
  const [urls, setUrls] = useState<string[]>([]);
  
  // إنشاء عنوان URL آمن للملف
  const createSafeObjectURL = useCallback((file: File): Promise<string> => {
    return new Promise((resolve) => {
      // استخدام FileReader لتحويل الملف إلى Data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setUrls(prevUrls => [...prevUrls, dataUrl]);
        resolve(dataUrl);
      };
      reader.onerror = () => {
        console.error("خطأ في قراءة الملف");
        // في حالة الفشل، محاولة استخدام URL.createObjectURL كخطة بديلة
        try {
          const blobUrl = URL.createObjectURL(file);
          setUrls(prevUrls => [...prevUrls, blobUrl]);
          resolve(blobUrl);
        } catch (error) {
          console.error("فشل في إنشاء URL للملف:", error);
          resolve(""); // إرجاع سلسلة فارغة في حالة فشل جميع المحاولات
        }
      };
      reader.readAsDataURL(file);
    });
  }, []);
  
  // إلغاء عنوان URL
  const revokeObjectURL = useCallback((url: string) => {
    // إلغاء العنوان فقط إذا كان من نوع Blob URL وليس Data URL
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
      setUrls(prevUrls => prevUrls.filter(u => u !== url));
    }
  }, []);
  
  // تنظيف جميع عناوين URL عند فك الهوك
  useEffect(() => {
    return () => {
      urls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [urls]);
  
  return { createSafeObjectURL, revokeObjectURL };
};
