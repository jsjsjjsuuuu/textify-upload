
import { useCallback } from "react";
import { ImageData } from "@/types/ImageData";

export const useDuplicateRemoval = (
  images: ImageData[],
  setAllImages: (newImages: ImageData[]) => void
) => {
  // إزالة التكرارات من قائمة الصور
  const removeDuplicates = useCallback(() => {
    const uniqueImagesMap = new Map<string, ImageData>();
    
    // ابتداء بالصور ذات الحالة "completed" للتأكد من الاحتفاظ بالصور المكتملة
    const sortedImages = [...images].sort((a, b) => {
      if (a.status === "completed" && b.status !== "completed") return -1;
      if (a.status !== "completed" && b.status === "completed") return 1;
      return 0;
    });
    
    // استخدام معرّف الصورة كمفتاح للتخزين المؤقت
    sortedImages.forEach(img => {
      if (!uniqueImagesMap.has(img.id)) {
        uniqueImagesMap.set(img.id, img);
      }
    });
    
    const uniqueImages = Array.from(uniqueImagesMap.values());
    
    if (uniqueImages.length < images.length) {
      console.log(`تم إزالة ${images.length - uniqueImages.length} صورة مكررة`);
      setAllImages(uniqueImages);
    }
  }, [images, setAllImages]);

  return {
    removeDuplicates
  };
};
