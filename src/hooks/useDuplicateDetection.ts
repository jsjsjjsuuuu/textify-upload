
import { useState, useCallback } from 'react';
import { ImageData } from '@/types/ImageData';

interface UseDuplicateDetectionOptions {
  enabled?: boolean;
}

export const useDuplicateDetection = (options: UseDuplicateDetectionOptions = {}) => {
  // تغيير القيمة الافتراضية إلى false لتعطيل فحص التكرار بشكل كامل
  const { enabled = false } = options;
  
  // استخدام مجموعة لتخزين توقيعات الصور المعالجة للكشف السريع
  const [processedImageSignatures, setProcessedImageSignatures] = useState<Set<string>>(new Set());
  const [processedImages, setProcessedImages] = useState<ImageData[]>([]);

  // إضافة صورة إلى قائمة الصور المعالجة - لا تفعل شيئاً إذا كان التعطيل مفعل
  const markImageAsProcessed = useCallback((image: ImageData) => {
    console.log("تم تعطيل تسجيل الصورة كمعالجة:", image.id);
    if (!enabled) return;
    
    // إضافة الصورة إلى قائمة الصور المعالجة
    setProcessedImages(prev => [...prev, image]);
    // لا تفعل شيئاً عندما يكون فحص التكرار معطل
    return;
  }, [enabled]);

  // التحقق مما إذا كانت الصورة قد تمت معالجتها مسبقًا - دائماً تعيد false حتى لو كانت مكررة
  const isDuplicateImage = useCallback(async (image: ImageData, images: ImageData[] = []): Promise<boolean> => {
    console.log("تم تعطيل فحص التكرار للصورة:", image.id);
    // دائمًا نُرجع false لتجاوز فحص التكرار
    return false;
  }, []);

  // نعدل هنا لنقدم نفس الواجهة القديمة مع نفس الاسم، مع الحفاظ على الواجهة الجديدة
  const checkDuplicateImage = isDuplicateImage;

  // إضافة صورة إلى الذاكرة المؤقتة للصور المعالجة - لا تفعل شيئاً
  const addToProcessedCache = useCallback((image: ImageData) => {
    console.log("تم تعطيل إضافة الصورة للذاكرة المؤقتة:", image.id);
    // لا تفعل شيئاً عندما يكون فحص التكرار معطل
    return;
  }, []);

  // التحقق من اكتمال معالجة الصورة - استخدام الوظيفة الموجودة
  const isProcessed = useCallback((image: ImageData): boolean => {
    return image.status === "completed" || image.status === "error";
  }, []);

  return {
    checkDuplicateImage,
    isDuplicateImage,
    markImageAsProcessed,
    addToProcessedCache,
    isFullyProcessed: isProcessed,
    processedImages
  };
};
