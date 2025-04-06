
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
      
      // في حالة حدوث أخطاء، قم بإعادة تعيين التخزين المحلي
      localStorage.removeItem('processedImageIds');
      localStorage.removeItem('processedImageHashes');
    }
  }, []);

  // حفظ معرفات الصور المعالجة في التخزين المحلي عند التغيير
  useEffect(() => {
    try {
      if (processedIds.size > 0) {
        localStorage.setItem('processedImageIds', JSON.stringify([...processedIds]));
      }
      
      if (processedHashes.size > 0) {
        localStorage.setItem('processedImageHashes', JSON.stringify([...processedHashes]));
      }
    } catch (error) {
      console.error('خطأ في حفظ بيانات الصور المعالجة في التخزين المحلي:', error);
    }
  }, [processedIds, processedHashes]);

  // إضافة صورة إلى الذاكرة المؤقتة للصور المعالجة
  const addToProcessedCache = useCallback((image: ImageData) => {
    if (!image || !image.id) {
      console.error('محاولة إضافة صورة غير صالحة إلى الذاكرة المؤقتة');
      return;
    }
    
    try {
      console.log(`إضافة الصورة ${image.id} إلى ذاكرة التخزين المؤقت للصور المعالجة`);
      
      // إضافة المعرف إلى القائمة
      setProcessedIds(prev => {
        const newSet = new Set(prev);
        newSet.add(image.id);
        return newSet;
      });

      // إضافة التجزئة إلى القائمة (فقط إذا كانت الصورة تحتوي على ملف)
      if (image.file) {
        const imageHash = createUniqueImageHash(image);
        setProcessedHashes(prev => {
          const newSet = new Set(prev);
          newSet.add(imageHash);
          return newSet;
        });
      }
      
      // حفظ مباشر إلى التخزين المحلي لتجنب فقدان البيانات
      try {
        const currentIds = localStorage.getItem('processedImageIds');
        let idsArray: string[] = currentIds ? JSON.parse(currentIds) : [];
        if (!idsArray.includes(image.id)) {
          idsArray.push(image.id);
          localStorage.setItem('processedImageIds', JSON.stringify(idsArray));
        }
        
        if (image.file) {
          const imageHash = createUniqueImageHash(image);
          const currentHashes = localStorage.getItem('processedImageHashes');
          let hashesArray: string[] = currentHashes ? JSON.parse(currentHashes) : [];
          if (!hashesArray.includes(imageHash)) {
            hashesArray.push(imageHash);
            localStorage.setItem('processedImageHashes', JSON.stringify(hashesArray));
          }
        }
      } catch (storageError) {
        console.error('خطأ في الحفظ المباشر للتخزين المحلي:', storageError);
      }
    } catch (error) {
      console.error('خطأ في إضافة الصورة إلى ذاكرة التخزين المؤقت:', error);
    }
  }, [createUniqueImageHash]);

  // التحقق من تكرار الصورة - تحسين المنطق بإضافة فحوصات للحالة والنص المستخرج
  const isDuplicateImage = useCallback((image: ImageData, images: ImageData[] = []): boolean => {
    if (!enabled || !image || !image.id) return false;

    try {
      // فحص إضافي: إذا كانت الصورة موجودة في قائمة الصور المكررة بنفس المعرف
      if (processedIds.has(image.id)) {
        console.log(`تم العثور على معرف مطابق في الذاكرة المؤقتة: ${image.id}`);
        return true;
      }
      
      // فحص إضافي: إذا كان لدينا الصورة بنفس الاسم والحجم والمستخدم
      if (image.file) {
        const matchingImages = images.filter(img => 
          img.id !== image.id && // ليست نفس الصورة
          img.file && 
          img.file.name === image.file.name && 
          img.file.size === image.file.size &&
          img.user_id === image.user_id
        );
        
        if (matchingImages.length > 0) {
          console.log(`تم العثور على صورة مطابقة بنفس الاسم والحجم والمستخدم: ${image.file.name}`);
          
          // تسجيل الصورة الحالية كمعالجة
          addToProcessedCache(image);
          return true;
        }
      }

      // فحص إضافي للحالة: إذا كانت الصورة تمت معالجتها مسبقًا (ناجحة أو فاشلة)
      if ((image.status === "completed" || image.status === "error") && image.extractedText) {
        console.log(`الصورة ${image.id} تم معالجتها بالفعل (${image.status})، إضافتها إلى الذاكرة المؤقتة`);
        // إضافة المعرف والتجزئة إلى الذاكرة المؤقتة
        addToProcessedCache(image);
        return true;
      }

      // فحص التجزئة فقط إذا كانت الصورة تحتوي على ملف
      if (image.file) {
        const imageHash = createUniqueImageHash(image);
        
        // فحص إضافي: التحقق من وجود التجزئة في قائمة التجزئات المعالجة
        if (processedHashes.has(imageHash)) {
          console.log(`تم العثور على تجزئة مطابقة في الذاكرة المؤقتة: ${imageHash} للصورة ${image.id}`);
          
          // تسجيل معرف الصورة كمعالج أيضًا
          addToProcessedCache(image);
          return true;
        }
      }
      
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

  // وظيفة لتحديد ما إذا كانت الصورة مكتملة المعالجة
  const isFullyProcessed = useCallback((image: ImageData): boolean => {
    // اعتبار الصورة معالجة في الحالات التالية:
    
    // 1. إذا كان معرفها موجوداً في قائمة المعرفات المعالجة
    if (image.id && processedIds.has(image.id)) {
      return true;
    }
    
    // 2. اعتبار الصورة معالجة إذا كانت حالتها مكتملة أو خطأ وتحتوي على نص مستخرج
    const hasBeenProcessed = (
      (image.status === "completed" || image.status === "error") && 
      !!image.extractedText
    );
    
    // 3. فحص إضافي: إذا كانت الصورة تحتوي على البيانات الأساسية
    const hasRequiredData = (
      !!image.code && 
      !!image.senderName && 
      !!image.phoneNumber
    );
    
    if (hasBeenProcessed || hasRequiredData) {
      // إضافة الصورة إلى الذاكرة المؤقتة إذا لم تكن موجودة بالفعل
      if (image.id && !processedIds.has(image.id)) {
        addToProcessedCache(image);
      }
      return true;
    }
    
    // 4. فحص إضافي للتجزئة إذا كانت الصورة تحتوي على ملف
    if (image.file) {
      try {
        const imageHash = createUniqueImageHash(image);
        if (processedHashes.has(imageHash)) {
          return true;
        }
      } catch (error) {
        console.error('خطأ في حساب تجزئة الصورة:', error);
      }
    }
    
    return false;
  }, [processedIds, processedHashes, createUniqueImageHash, addToProcessedCache]);

  // تسجيل صورة كمعالجة بالكامل
  const markImageAsProcessed = useCallback((image: ImageData): boolean => {
    if (!image || !image.id) {
      console.error('محاولة تسجيل صورة غير صالحة كمعالجة');
      return false;
    }
    
    // تسجيل الصورة كمعالجة بغض النظر عن حالتها
    console.log(`تسجيل الصورة ${image.id} كمعالجة بالكامل (${image.status || 'غير معروف'})`);
    
    // إضافة الصورة إلى الذاكرة المؤقتة
    addToProcessedCache(image);
    return true;
  }, [addToProcessedCache]);

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
