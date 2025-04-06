
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

  // استعادة معرفات الصور المعالجة من التخزين المحلي عند بدء التشغيل
  useEffect(() => {
    try {
      // استرجاع معرفات الصور المعالجة
      const storedProcessedIds = localStorage.getItem('processedImageIds');
      if (storedProcessedIds) {
        const idsArray = JSON.parse(storedProcessedIds);
        setProcessedIds(new Set(idsArray));
        console.log(`تم تحميل ${idsArray.length} معرف صورة معالجة من التخزين المحلي`);
      }
      
      // استرجاع تجزئات الصور المعالجة
      const storedProcessedHashes = localStorage.getItem('processedImageHashes');
      if (storedProcessedHashes) {
        const hashesArray = JSON.parse(storedProcessedHashes);
        setProcessedHashes(new Set(hashesArray));
        console.log(`تم تحميل ${hashesArray.length} تجزئة صورة معالجة من التخزين المحلي`);
      }
    } catch (error) {
      console.error('خطأ في تحميل بيانات الصور المعالجة من التخزين المحلي:', error);
    }
  }, []);

  // حفظ معرفات الصور المعالجة في التخزين المحلي عند التغيير
  useEffect(() => {
    if (processedIds.size > 0) {
      localStorage.setItem('processedImageIds', JSON.stringify([...processedIds]));
    }
    
    if (processedHashes.size > 0) {
      localStorage.setItem('processedImageHashes', JSON.stringify([...processedHashes]));
    }
  }, [processedIds, processedHashes]);

  // التحقق من تكرار الصورة - تحسين المنطق بإضافة فحوصات للحالة والنص المستخرج
  const isDuplicateImage = useCallback((image: ImageData, images: ImageData[] = []): boolean => {
    if (!enabled || !image) return false;

    try {
      // فحص إضافي: إذا كانت الصورة موجودة في قائمة الصور المكررة بنفس المعرف
      if (processedIds.has(image.id)) {
        console.log(`تم العثور على معرف مطابق في الذاكرة المؤقتة: ${image.id}`);
        return true;
      }

      // فحص إضافي للحالة: إذا كانت الصورة مكتملة أو تم معالجتها سابقًا
      if (image.status === "completed" && image.extractedText && image.code && image.senderName && image.phoneNumber) {
        console.log(`الصورة ${image.id} مكتملة بالفعل، إضافتها إلى الذاكرة المؤقتة وتجاهلها`);
        // إضافة المعرف والتجزئة إلى الذاكرة المؤقتة
        addToProcessedCache(image);
        return true;
      }

      // إنشاء تجزئة للصورة
      const imageHash = createUniqueImageHash(image);
      
      // فحص إضافي: التحقق من وجود التجزئة في قائمة التجزئات المعالجة
      if (processedHashes.has(imageHash)) {
        console.log(`تم العثور على تجزئة مطابقة في الذاكرة المؤقتة: ${imageHash} للصورة ${image.id}`);
        return true;
      }
      
      // فحص إضافي للنص المستخرج: تخطي الصور التي لديها نص مستخرج وجميع البيانات المطلوبة
      if (image.extractedText && image.extractedText.length > 10 && 
          image.code && image.senderName && image.phoneNumber) {
        console.log(`الصورة ${image.id} لديها نص مستخرج وبيانات مطلوبة، إضافتها إلى الذاكرة المؤقتة`);
        addToProcessedCache(image);
        return true;
      }
      
      // تحديد ما إذا كنا سنتجاهل الصور المؤقتة
      const checkDuplicateOptions = { ignoreTemporary };
      
      // البحث عن تكرارات في قائمة الصور باستخدام الوظيفة المساعدة
      const isDuplicate = isImageDuplicate(image, images, ignoreTemporary);
      
      // إذا تم اكتشاف أن الصورة مكررة، نضيفها إلى الذاكرة المؤقتة
      if (isDuplicate) {
        console.log(`تم اكتشاف صورة مكررة عبر المقارنة: ${image.id}`);
        addToProcessedCache(image);
      }
      
      return isDuplicate;
    } catch (error) {
      console.error('خطأ في اكتشاف تكرار الصورة:', error);
      return false;
    }
  }, [processedHashes, processedIds, createUniqueImageHash, enabled, ignoreTemporary, addToProcessedCache]);

  // إضافة صورة إلى الذاكرة المؤقتة للصور المعالجة
  const addToProcessedCache = useCallback((image: ImageData) => {
    try {
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
      
      console.log(`تمت إضافة الصورة ${image.id} إلى ذاكرة التخزين المؤقت للصور المعالجة`);
    } catch (error) {
      console.error('خطأ في إضافة الصورة إلى ذاكرة التخزين المؤقت:', error);
    }
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
    localStorage.removeItem('processedImageHashes');
    
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
