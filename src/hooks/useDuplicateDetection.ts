
import { useState, useCallback } from 'react';
import { ImageData } from '@/types/ImageData';
import { isImageDuplicate, isFullyProcessed } from '@/utils/duplicateDetection';

interface UseDuplicateDetectionOptions {
  enabled?: boolean;
}

export const useDuplicateDetection = (options: UseDuplicateDetectionOptions = {}) => {
  const { enabled = true } = options;
  
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
    if (!enabled || !image || !image.id) return false;
    
    // التحقق من وجود توقيع الصورة في المجموعة
    const imageSignature = `id-${image.id}`;
    if (processedImageSignatures.has(imageSignature)) {
      console.log(`الصورة ${image.id} موجودة في قائمة الصور المعالجة`);
      return true;
    }
    
    // التحقق من وجود الصورة في قائمة الصور المتوفرة
    return isImageDuplicate(image, images);
  }, [enabled, processedImageSignatures]);

  // التحقق مما إذا كانت الصورة قد تمت معالجتها مسبقًا بشكل متزامن
  const isDuplicateImage = useCallback(async (image: ImageData, images: ImageData[]): Promise<boolean> => {
    return checkDuplicateImage(image, images);
  }, [checkDuplicateImage]);

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
