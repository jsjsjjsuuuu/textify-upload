
import { useCallback } from "react";
import { ImageData } from "@/types/ImageData";

export const useDuplicateRemoval = (images: ImageData[], setAllImages: (images: ImageData[]) => void) => {
  // إزالة التكرارات من قائمة الصور
  const removeDuplicates = useCallback(() => {
    const uniqueImagesMap = new Map<string, ImageData>();
    const idMap = new Map<string, boolean>();
    
    // ابتداء بالصور ذات الحالة "completed" للتأكد من الاحتفاظ بالصور المكتملة
    const sortedImages = [...images].sort((a, b) => {
      if (a.status === "completed" && b.status !== "completed") return -1;
      if (a.status !== "completed" && b.status === "completed") return 1;
      return 0;
    });
    
    // استخدام معرّف الصورة كمفتاح للتخزين المؤقت
    sortedImages.forEach(img => {
      // تجاهل الصور التي ليس لها معرف
      if (!img || !img.id) return;
      
      // تسجيل معرف الصورة
      idMap.set(img.id, true);
      
      // إنشاء مفتاح فريد بناءً على معرف الصورة
      const key = `id-${img.id}`;
      
      // إذا لم يكن هناك صورة بهذا المفتاح، أو إذا كانت الصورة الحالية أحدث
      // أو إذا كانت الصورة الحالية مكتملة والصورة الموجودة غير مكتملة
      const existingImage = uniqueImagesMap.get(key);
      
      // المقارنة حسب الأولوية: مكتملة > تحتوي بيانات > الأحدث
      const currentIsComplete = img.status === "completed" && existingImage?.status !== "completed";
      const currentHasMoreData = 
        !!img.extractedText && 
        !!img.code && 
        !existingImage?.extractedText;
      const currentIsNewer = 
        img.added_at && existingImage?.added_at && 
        img.added_at > existingImage.added_at;
      
      const shouldReplace = 
        !existingImage || 
        currentIsComplete || 
        currentHasMoreData || 
        (currentIsNewer && existingImage.status !== "completed");
      
      if (shouldReplace) {
        uniqueImagesMap.set(key, img);
      }
    });
    
    // تحويل الخريطة إلى مصفوفة
    const uniqueImages = Array.from(uniqueImagesMap.values());
    
    if (uniqueImages.length < images.length) {
      console.log(`تم إزالة ${images.length - uniqueImages.length} صورة مكررة`);
      setAllImages(uniqueImages);
    }
  }, [images, setAllImages]);

  return { removeDuplicates };
};
