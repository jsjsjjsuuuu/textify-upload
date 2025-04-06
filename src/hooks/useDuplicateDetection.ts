
import { useState, useCallback } from 'react';
import { ImageData } from '@/types/ImageData';
import { useToast } from '@/hooks/use-toast';
import CryptoJS from 'crypto-js';
import { createImageHash, isImageDuplicate } from '@/utils/duplicateDetection';

interface UseDuplicateDetectionOptions {
  enabled?: boolean;
  ignoreTemporary?: boolean;
}

export const useDuplicateDetection = (options: UseDuplicateDetectionOptions = {}) => {
  const { enabled = true, ignoreTemporary = true } = options;
  const [processedHashes, setProcessedHashes] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // تحسين وظيفة إنشاء تجزئة للصورة
  const createUniqueImageHash = useCallback((image: ImageData): string => {
    // إنشاء سلسلة فريدة تتضمن المزيد من المعلومات لتجنب التكرار الكاذب
    const uniqueIdentifiers = [
      image.file.name,
      image.file.size.toString(),
      image.file.lastModified.toString(),
      image.user_id || '',
      image.batch_id || ''
    ].join('|');
    
    // استخدام خوارزمية MD5 لإنشاء بصمة للصورة
    return CryptoJS.MD5(uniqueIdentifiers).toString();
  }, []);

  // التحقق من تكرار الصورة - تحسين المنطق
  const isDuplicateImage = useCallback((image: ImageData, images: ImageData[] = []): boolean => {
    if (!enabled || !image) return false;

    try {
      // إنشاء تجزئة للصورة
      const imageHash = createUniqueImageHash(image);
      
      // التحقق من وجود التجزئة في قائمة التجزئات المعالجة
      if (processedHashes.has(imageHash)) {
        console.log(`تم العثور على تجزئة مطابقة في الذاكرة المؤقتة: ${imageHash} للصورة ${image.id}`);
        return true;
      }
      
      // تحديد ما إذا كنا سنتجاهل الصور المؤقتة
      const checkDuplicateOptions = { ignoreTemporary };
      
      // استخدام الوظيفة المساعدة من utils/duplicateDetection
      const isDuplicate = isImageDuplicate(image, images, ignoreTemporary);
      
      // إذا لم يكن هناك تكرار وليست صورة مؤقتة، إضافة التجزئة إلى القائمة
      if (!isDuplicate && !image.sessionImage) {
        console.log(`إضافة تجزئة جديدة إلى الذاكرة المؤقتة: ${imageHash} للصورة ${image.id}`);
        setProcessedHashes(prev => {
          const newSet = new Set(prev);
          newSet.add(imageHash);
          return newSet;
        });
      }
      
      return isDuplicate;
    } catch (error) {
      console.error('خطأ في اكتشاف تكرار الصورة:', error);
      return false;
    }
  }, [processedHashes, createUniqueImageHash, enabled, ignoreTemporary]);

  // مسح ذاكرة التخزين المؤقت للتجزئات
  const clearProcessedHashesCache = useCallback(() => {
    console.log('تم مسح ذاكرة التخزين المؤقت لتجزئات الصور');
    setProcessedHashes(new Set());
    
    toast({
      title: "تم مسح الذاكرة المؤقتة",
      description: "تم مسح ذاكرة التخزين المؤقت لاكتشاف الصور المكررة"
    });
  }, [toast]);

  return {
    isDuplicateImage,
    clearProcessedHashesCache,
    processedHashesCount: processedHashes.size
  };
};
