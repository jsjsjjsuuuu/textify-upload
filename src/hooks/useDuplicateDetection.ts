
import { useState, useCallback } from 'react';
import { ImageData } from '@/types/ImageData';

interface DuplicateDetectionOptions {
  enabled?: boolean;
  simThreshold?: number;
}

export const useDuplicateDetection = (options: DuplicateDetectionOptions = {}) => {
  const { enabled = true, simThreshold = 0.90 } = options;
  const [processedImages, setProcessedImages] = useState<ImageData[]>([]);
  
  // التحقق مما إذا كانت الصورة مكررة
  const isDuplicateImage = useCallback(async (image: ImageData, existingImages: ImageData[] = []): Promise<boolean> => {
    // إذا كانت خاصية التحقق من التكرار معطلة، إرجاع false دائمًا
    if (!enabled) {
      return false;
    }
    
    console.log("التحقق من تكرار الصورة:", image.id);
    
    // محاكاة التحقق من التكرار - في التطبيق الحقيقي سيتم مقارنة الصور فعليًا
    return false;
  }, [enabled]);

  // تسجيل صورة كمعالجة
  const markImageAsProcessed = useCallback((image: ImageData) => {
    setProcessedImages(prev => [...prev, image]);
  }, []);
  
  return {
    isDuplicateImage,
    markImageAsProcessed,
    processedImages
  };
};
