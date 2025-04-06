
import { useState, useCallback, useEffect } from 'react';
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
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());
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

  // حفظ معرفات الصور في التخزين المحلي للمتصفح للتذكر بين الجلسات
  useEffect(() => {
    // استرجاع معرفات الصور المعالجة من التخزين المحلي عند بدء التشغيل
    const storedProcessedIds = localStorage.getItem('processedImageIds');
    if (storedProcessedIds) {
      try {
        const idsArray = JSON.parse(storedProcessedIds);
        setProcessedIds(new Set(idsArray));
        console.log(`تم تحميل ${idsArray.length} معرف صورة معالجة من التخزين المحلي`);
      } catch (error) {
        console.error('خطأ في تحميل معرفات الصور المعالجة:', error);
      }
    }
  }, []);

  // حفظ معرفات الصور المعالجة في التخزين المحلي عند التغيير
  useEffect(() => {
    if (processedIds.size > 0) {
      localStorage.setItem('processedImageIds', JSON.stringify([...processedIds]));
    }
  }, [processedIds]);

  // التحقق من تكرار الصورة - تحسين المنطق بإضافة فحوصات للحالة والنص المستخرج
  const isDuplicateImage = useCallback((image: ImageData, images: ImageData[] = []): boolean => {
    if (!enabled || !image) return false;

    try {
      // التحقق من وجود المعرف في قائمة المعرفات المعالجة
      if (processedIds.has(image.id)) {
        console.log(`تم العثور على معرف مطابق في الذاكرة المؤقتة: ${image.id}`);
        return true;
      }

      // إنشاء تجزئة للصورة
      const imageHash = createUniqueImageHash(image);
      
      // التحقق من وجود التجزئة في قائمة التجزئات المعالجة
      if (processedHashes.has(imageHash)) {
        console.log(`تم العثور على تجزئة مطابقة في الذاكرة المؤقتة: ${imageHash} للصورة ${image.id}`);
        return true;
      }
      
      // التحقق من حالة الصورة - إذا كانت الصورة مكتملة أو تم معالجتها، اعتبرها مكررة
      if (image.status === "completed") {
        console.log(`الصورة ${image.id} مكتملة بالفعل، إضافتها كمكررة`);
        
        // إضافة المعرف والتجزئة إلى الذاكرة المؤقتة
        addToProcessedCache(image);
        return true;
      }
      
      // تحديد ما إذا كنا سنتجاهل الصور المؤقتة
      const checkDuplicateOptions = { ignoreTemporary };
      
      // استخدام الوظيفة المساعدة من utils/duplicateDetection
      const isDuplicate = isImageDuplicate(image, images, ignoreTemporary);
      
      // إذا لم يكن هناك تكرار وليست صورة مؤقتة وتحتوي على نص مستخرج، إضافة التجزئة إلى القائمة
      if (!isDuplicate && !image.sessionImage && image.extractedText && image.extractedText.length > 10) {
        console.log(`إضافة صورة جديدة معالجة إلى الذاكرة المؤقتة: ${image.id}`);
        addToProcessedCache(image);
      }
      
      return isDuplicate;
    } catch (error) {
      console.error('خطأ في اكتشاف تكرار الصورة:', error);
      return false;
    }
  }, [processedHashes, processedIds, createUniqueImageHash, enabled, ignoreTemporary]);

  // إضافة صورة إلى الذاكرة المؤقتة للصور المعالجة
  const addToProcessedCache = useCallback((image: ImageData) => {
    // إضافة المعرف إلى القائمة
    setProcessedIds(prev => {
      const newSet = new Set(prev);
      newSet.add(image.id);
      return newSet;
    });

    // إضافة التجزئة إلى القائمة
    const imageHash = createUniqueImageHash(image);
    setProcessedHashes(prev => {
      const newSet = new Set(prev);
      newSet.add(imageHash);
      return newSet;
    });
  }, [createUniqueImageHash]);

  // وظيفة لتحديد ما إذا كانت الصورة مكتملة المعالجة
  const isFullyProcessed = useCallback((image: ImageData): boolean => {
    return (
      !!image.extractedText && 
      image.extractedText.length > 10 && 
      !!image.code && 
      !!image.senderName && 
      !!image.phoneNumber &&
      (image.status === "completed" || image.status === "error")
    );
  }, []);

  // تسجيل صورة كمعالجة بالكامل
  const markImageAsProcessed = useCallback((image: ImageData) => {
    if (isFullyProcessed(image)) {
      addToProcessedCache(image);
      return true;
    }
    return false;
  }, [isFullyProcessed, addToProcessedCache]);

  // مسح ذاكرة التخزين المؤقت للتجزئات
  const clearProcessedHashesCache = useCallback(() => {
    console.log('تم مسح ذاكرة التخزين المؤقت لتجزئات الصور');
    setProcessedHashes(new Set());
    setProcessedIds(new Set());
    localStorage.removeItem('processedImageIds');
    
    toast({
      title: "تم مسح الذاكرة المؤقتة",
      description: "تم مسح ذاكرة التخزين المؤقت لاكتشاف الصور المكررة"
    });
  }, [toast]);

  return {
    isDuplicateImage,
    clearProcessedHashesCache,
    processedHashesCount: processedHashes.size,
    processedIdsCount: processedIds.size,
    markImageAsProcessed,
    isFullyProcessed,
    addToProcessedCache
  };
};
