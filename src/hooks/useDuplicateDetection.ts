
import { useState, useCallback } from 'react';
import { ImageData } from '@/types/ImageData';
import { useToast } from '@/hooks/use-toast';
import CryptoJS from 'crypto-js';

interface UseDuplicateDetectionOptions {
  enabled?: boolean;
}

export const useDuplicateDetection = (options: UseDuplicateDetectionOptions = {}) => {
  const { enabled = true } = options;
  const [processedHashes, setProcessedHashes] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // إنشاء تجزئة للصورة للكشف عن التكرار
  const createImageHash = useCallback((image: ImageData): string => {
    // إنشاء سلسلة فريدة من بيانات الصورة
    const uniqueString = `${image.file.name}-${image.file.size}-${image.file.lastModified}`;
    // استخدام خوارزمية MD5 لإنشاء بصمة للصورة
    return CryptoJS.MD5(uniqueString).toString();
  }, []);

  // التحقق من تكرار الصورة
  const isDuplicateImage = useCallback((image: ImageData, images: ImageData[] = []): boolean => {
    if (!enabled) return false;

    try {
      // إنشاء تجزئة للصورة
      const imageHash = createImageHash(image);
      
      // التحقق من وجود التجزئة في قائمة التجزئات المعالجة
      if (processedHashes.has(imageHash)) {
        return true;
      }
      
      // التحقق من تكرار الصورة في قائمة الصور
      const isDuplicate = images.some(img => {
        // التحقق من تطابق الاسم والحجم والتاريخ
        return (
          img.file.name === image.file.name &&
          img.file.size === image.file.size &&
          img.file.lastModified === image.file.lastModified &&
          img.sessionImage !== true // تجاهل الصور المؤقتة
        );
      });
      
      // إذا لم يكن هناك تكرار، إضافة التجزئة إلى القائمة
      if (!isDuplicate) {
        setProcessedHashes(prev => new Set(prev).add(imageHash));
      }
      
      return isDuplicate;
    } catch (error) {
      console.error('خطأ في اكتشاف تكرار الصورة:', error);
      return false;
    }
  }, [processedHashes, createImageHash, enabled]);

  // مسح ذاكرة التخزين المؤقت للتجزئات
  const clearProcessedHashesCache = useCallback(() => {
    setProcessedHashes(new Set());
  }, []);

  return {
    isDuplicateImage,
    clearProcessedHashesCache
  };
};
