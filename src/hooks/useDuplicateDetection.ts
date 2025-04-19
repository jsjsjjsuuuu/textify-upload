
import { useState, useCallback } from 'react';
import { ImageData } from '@/types/ImageData';
import { isDuplicateImage, markImageAsProcessed } from '@/utils/duplicateDetection/uniqueImageFinder';

interface DuplicateDetectionOptions {
  enabled?: boolean;
  threshold?: number;
}

export const useDuplicateDetection = (options: DuplicateDetectionOptions = {}) => {
  const { enabled = true, threshold = 0.9 } = options;
  const [duplicateCount, setDuplicateCount] = useState<number>(0);

  // فحص ما إذا كانت الصورة مكررة
  const checkDuplicateImage = useCallback(
    async (file: File, images: ImageData[]): Promise<boolean> => {
      // إذا كانت الميزة معطلة، دائمًا إرجاع false (ليست مكررة)
      if (!enabled) return false;

      try {
        // فحص التكرار باستخدام الأداة الموجودة
        const isDuplicate = await isDuplicateImage(file, images);
        
        // إذا كانت مكررة، زيادة العداد
        if (isDuplicate) {
          setDuplicateCount((prev) => prev + 1);
        }
        
        return isDuplicate;
      } catch (error) {
        console.error("خطأ في فحص تكرار الصورة:", error);
        return false;
      }
    },
    [enabled]
  );

  // تسجيل صورة كمعالجة لتجنب إعادة معالجتها
  const markAsProcessed = useCallback((image: ImageData): void => {
    if (enabled && image) {
      markImageAsProcessed(image);
    }
  }, [enabled]);

  return {
    duplicateCount,
    checkDuplicateImage,
    markImageAsProcessed: markAsProcessed,
    // إضافة وظيفة مشابهة للتوافق مع الأكواد الأخرى
    isDuplicateImage: checkDuplicateImage
  };
};

export default useDuplicateDetection;
