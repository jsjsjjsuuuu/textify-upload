
import { useState, useCallback } from 'react';
import { ImageData } from '@/types/ImageData';
import { isImageDuplicate, isFullyProcessed } from '@/utils/duplicateDetection';

interface UseDuplicateDetectionOptions {
  enabled?: boolean;
}

export const useDuplicateDetection = (options: UseDuplicateDetectionOptions = {}) => {
  const { enabled = false } = options; // تغيير القيمة الافتراضية إلى false لتعطيل فحص التكرار
  
  // استخدام مجموعة لتخزين توقيعات الصور المعالجة للكشف السريع
  const [processedImageSignatures, setProcessedImageSignatures] = useState<Set<string>>(new Set());

  // إضافة صورة إلى قائمة الصور المعالجة
  const markImageAsProcessed = useCallback((image: ImageData) => {
    if (!enabled || !image || !image.id) return;
    
    // إنشاء توقيع للصورة
    const imageSignature = `id-${image.id}`;
    
    // إضافة التوقيع إلى المجموعة
    setProcessedImageSignatures(prev => {
      const newSignatures = new Set(prev);
      newSignatures.add(imageSignature);
      return newSignatures;
    });
  }, [enabled]);

  // التحقق مما إذا كانت الصورة قد تمت معالجتها مسبقًا
  const checkDuplicateImage = useCallback(async (image: ImageData, images: ImageData[]): Promise<boolean> => {
    // دائمًا نُرجع false لتجاوز فحص التكرار
    return false;
  }, []);

  // التحقق مما إذا كانت الصورة قد تمت معالجتها مسبقًا بشكل متزامن
  const isDuplicateImage = useCallback(async (image: ImageData, images: ImageData[]): Promise<boolean> => {
    // دائمًا نُرجع false لتجاوز فحص التكرار
    return false;
  }, []);

  // إضافة صورة إلى الذاكرة المؤقتة للصور المعالجة
  const addToProcessedCache = useCallback((image: ImageData) => {
    markImageAsProcessed(image);
  }, [markImageAsProcessed]);

  // التحقق من اكتمال معالجة الصورة
  const isProcessed = useCallback((image: ImageData): boolean => {
    return isFullyProcessed(image);
  }, []);

  return {
    checkDuplicateImage,
    isDuplicateImage,
    markImageAsProcessed,
    addToProcessedCache,
    isFullyProcessed: isProcessed
  };
};
