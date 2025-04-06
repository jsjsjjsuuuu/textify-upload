
import { useState, useCallback, useRef, useEffect } from 'react';
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
  const processedHashesRef = useRef<Set<string>>(new Set());
  const { toast } = useToast();
  
  // تحديث مرجع processedHashes عندما تتغير قيمته للحفاظ على التزامن
  useEffect(() => {
    processedHashesRef.current = processedHashes;
  }, [processedHashes]);

  // تحسين وظيفة إنشاء تجزئة للصورة مع إضافة تحسينات استقرار
  const createUniqueImageHash = useCallback((image: ImageData): string => {
    if (!image || !image.file) {
      console.warn('محاولة إنشاء تجزئة لصورة غير صالحة', image);
      // إرجاع قيمة للصور غير الصالحة للتمييز
      return 'invalid-image-hash';
    }
    
    // إنشاء سلسلة فريدة لتعريف الصورة بشكل أكثر استقراراً
    const uniqueIdentifiers = [
      image.file.name,
      image.file.size.toString(),
      image.file.lastModified.toString(),
      image.user_id || '',
      image.batch_id || '',
      image.id || ''  // إضافة معرف الصورة أيضاً للتمايز الإضافي
    ].filter(Boolean).join('|');
    
    // استخدام خوارزمية MD5 لإنشاء بصمة للصورة
    return CryptoJS.MD5(uniqueIdentifiers).toString();
  }, []);

  // التحقق من تكرار الصورة مع تحسين الكاش
  const isDuplicateImage = useCallback((image: ImageData, images: ImageData[] = []): boolean => {
    if (!enabled || !image || !image.file) return false;
    
    try {
      // تجنب معالجة الصور الخاطئة
      if (image.status === "error") {
        console.log(`تم تجاهل صورة بها خطأ من فحص التكرار: ${image.id}`);
        return false;
      }

      // إنشاء تجزئة للصورة
      const imageHash = createUniqueImageHash(image);
      
      // التحقق من وجود التجزئة في مجموعة التجزئات المعالجة
      if (processedHashesRef.current.has(imageHash)) {
        console.log(`تم العثور على تجزئة مطابقة في الذاكرة المؤقتة: ${imageHash} للصورة ${image.id}`);
        return true;
      }
      
      // تحديد ما إذا كانت الصورة موجودة بالفعل في المجموعة
      const isDuplicate = isImageDuplicate(image, images, ignoreTemporary);
      
      // إذا تم اكتشاف أنها مكررة، أضف التجزئة إلى الذاكرة المؤقتة
      if (isDuplicate) {
        console.log(`إضافة تجزئة مكررة إلى الذاكرة المؤقتة: ${imageHash} للصورة ${image.id}`);
        setProcessedHashes(prev => {
          const newSet = new Set(prev);
          newSet.add(imageHash);
          return newSet;
        });
      }
      // إذا لم يكن هناك تكرار وليست صورة مؤقتة، إضافة التجزئة إلى القائمة
      else if (!image.sessionImage && image.status === "completed") {
        console.log(`إضافة تجزئة جديدة للصورة المكتملة إلى الذاكرة المؤقتة: ${imageHash} للصورة ${image.id}`);
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
  }, [processedHashesRef, createUniqueImageHash, enabled, ignoreTemporary]);

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
