
import { useCallback, useRef } from 'react';
import { ImageData } from '@/types/ImageData';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// آلية تحسين الأداء: استخدام مخزن محلي لتخزين معرفات الصور التي تم التحقق منها
// للتقليل من عدد الاستعلامات إلى قاعدة البيانات
const LOCAL_STORAGE_KEY_DUPLICATES = 'processed_image_signatures';

interface DuplicateDetectionOptions {
  enabled?: boolean;
}

export function useDuplicateDetection(options?: DuplicateDetectionOptions) {
  const { enabled = true } = options || {};
  const { toast } = useToast();
  const cachedSignaturesRef = useRef<Map<string, boolean>>(new Map());

  // تحميل البيانات من التخزين المحلي عند التهيئة
  if (typeof window !== 'undefined' && cachedSignaturesRef.current.size === 0) {
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY_DUPLICATES);
      if (storedData) {
        const signatures = JSON.parse(storedData);
        signatures.forEach((sig: string) => cachedSignaturesRef.current.set(sig, true));
        console.log(`تم تحميل ${signatures.length} توقيع مخزن للصور المعالجة`);
      }
    } catch (error) {
      console.error('خطأ في تحميل بيانات الصور المعالجة:', error);
    }
  }

  /**
   * إنشاء توقيع فريد للصورة بناءً على خصائصها
   */
  const createImageSignature = useCallback((image: ImageData | File): string => {
    if ('id' in image && image.id) {
      return `id:${image.id}`;
    }
    
    if ('file' in image && image.file) {
      const { name, size, lastModified } = image.file;
      return `file:${name}:${size}:${lastModified || '0'}`;
    }
    
    if (!('id' in image)) {
      // إذا كان الملف من نوع File
      const file = image as File;
      return `file:${file.name}:${file.size}:${file.lastModified || '0'}`;
    }
    
    // في حالة عدم وجود معلومات كافية، استخدم أي بيانات متاحة
    const timestamp = Date.now();
    return `unknown:${timestamp}`;
  }, []);

  /**
   * حفظ بصمة الصورة في التخزين المؤقت المحلي
   */
  const saveSignatureToCache = useCallback((signature: string): void => {
    cachedSignaturesRef.current.set(signature, true);
    
    // حفظ البيانات في التخزين المحلي أيضًا
    try {
      const allSignatures = Array.from(cachedSignaturesRef.current.keys());
      localStorage.setItem(LOCAL_STORAGE_KEY_DUPLICATES, JSON.stringify(allSignatures));
    } catch (error) {
      console.error('خطأ في حفظ بيانات الصور المعالجة:', error);
    }
  }, []);

  /**
   * التحقق من وجود الصورة في الذاكرة المؤقتة المحلية
   */
  const isImageInLocalCache = useCallback((image: ImageData | File): boolean => {
    if (!enabled) return false;
    const signature = createImageSignature(image);
    return cachedSignaturesRef.current.has(signature);
  }, [createImageSignature, enabled]);

  /**
   * التحقق من وجود الصورة في قاعدة البيانات
   */
  const checkImageInDatabase = useCallback(async (image: ImageData): Promise<boolean> => {
    if (!enabled) return false;
    try {
      // إذا كانت الصورة تحتوي على معرف
      if (image.id) {
        const { data, error } = await supabase
          .from('images')
          .select('id')
          .eq('id', image.id)
          .maybeSingle();
        
        if (data) {
          console.log(`الصورة موجودة في قاعدة البيانات بمعرف: ${image.id}`);
          return true;
        }
      }
      
      // البحث باستخدام خصائص الملف إذا كانت متوفرة
      if (image.file) {
        const { name, size } = image.file;
        const { data, error } = await supabase
          .from('images')
          .select('id')
          .eq('file_name', name)
          .eq('user_id', image.user_id || '')
          .maybeSingle();
        
        if (data) {
          console.log(`الصورة موجودة في قاعدة البيانات باسم الملف: ${name}`);
          return true;
        }
      }

      // البحث باستخدام البيانات المستخرجة إذا كان لدينا معلومات كافية
      if (image.code && image.phoneNumber) {
        const { data, error } = await supabase
          .from('images')
          .select('id')
          .eq('code', image.code)
          .eq('phone_number', image.phoneNumber)
          .eq('user_id', image.user_id || '')
          .maybeSingle();
        
        if (data) {
          console.log(`الصورة موجودة في قاعدة البيانات بنفس الكود ورقم الهاتف`);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('خطأ في التحقق من قاعدة البيانات:', error);
      return false;
    }
  }, [enabled]);

  /**
   * التحقق من وجود الصورة في القائمة المحلية
   */
  const isImageInLocalList = useCallback((image: ImageData, imagesList: ImageData[]): boolean => {
    if (!enabled) return false;
    // تخطي المقارنة إذا كانت القائمة فارغة
    if (!imagesList || imagesList.length === 0) return false;
    
    // المقارنة بالمعرف أولاً
    if (image.id) {
      const existsById = imagesList.some(img => img.id === image.id);
      if (existsById) return true;
    }
    
    // المقارنة باسم الملف وحجمه إذا كان متاحًا
    if (image.file) {
      const existsByFile = imagesList.some(img => 
        img.file && 
        img.file.name === image.file.name && 
        img.file.size === image.file.size &&
        img.user_id === image.user_id
      );
      if (existsByFile) return true;
    }
    
    // المقارنة بالبيانات المستخرجة
    if (image.code && image.phoneNumber) {
      return imagesList.some(img => 
        img.code === image.code && 
        img.phoneNumber === image.phoneNumber &&
        img.user_id === image.user_id
      );
    }
    
    return false;
  }, [enabled]);

  /**
   * الدالة الرئيسية للتحقق من التكرار
   * تتحقق أولاً من الذاكرة المؤقتة المحلية، ثم القائمة المحلية، ثم قاعدة البيانات
   * تم تعديل توقيع الدالة لتتوافق مع واجهة DuplicateDetector
   */
  const isDuplicateImage = useCallback((image: ImageData, imagesList: ImageData[] = []): boolean => {
    // للتوافق مع واجهة DuplicateDetector، نجعل الدالة ترجع قيمة منطقية مباشرة
    // ونقوم بالتحقق فقط من الذاكرة المؤقتة المحلية والقائمة المحلية (عمليات غير متزامنة)
    if (!enabled) return false;
  
    // التحقق أولاً من الذاكرة المؤقتة المحلية (أسرع طريقة)
    if (isImageInLocalCache(image)) {
      console.log('الصورة موجودة في الذاكرة المؤقتة المحلية');
      return true;
    }
    
    // التحقق من القائمة المحلية
    if (isImageInLocalList(image, imagesList)) {
      console.log('الصورة موجودة في القائمة المحلية');
      
      // حفظ البصمة في الذاكرة المؤقتة لتسريع عمليات البحث المستقبلية
      saveSignatureToCache(createImageSignature(image));
      return true;
    }
    
    // نتائج سلبية: الصورة غير موجودة في التخزين المحلي أو القائمة المحلية
    return false;
  }, [
    enabled,
    isImageInLocalCache, 
    isImageInLocalList, 
    saveSignatureToCache, 
    createImageSignature
  ]);

  /**
   * وظيفة متزامنة للتحقق من التكرار الشامل بما في ذلك قاعدة البيانات
   */
  const checkDuplicateImage = useCallback(async (image: ImageData, imagesList: ImageData[] = []): Promise<boolean> => {
    if (!enabled) return false;
    
    // التحقق أولاً من الذاكرة المحلية والقائمة المحلية (مثل isDuplicateImage)
    if (isDuplicateImage(image, imagesList)) {
      return true;
    }
    
    // التحقق من قاعدة البيانات (أبطأ طريقة لأنها تتطلب اتصالًا بالخادم)
    const existsInDatabase = await checkImageInDatabase(image);
    
    if (existsInDatabase) {
      // حفظ البصمة في الذاكرة المؤقتة
      saveSignatureToCache(createImageSignature(image));
      return true;
    }
    
    // الصورة غير موجودة في أي مكان
    return false;
  }, [
    enabled,
    isDuplicateImage,
    checkImageInDatabase,
    saveSignatureToCache,
    createImageSignature
  ]);

  /**
   * تسجيل الصورة كمعالجة (لمنع معالجتها مرة أخرى)
   */
  const markImageAsProcessed = useCallback((image: ImageData | File): void => {
    if (!enabled) return;
    const signature = createImageSignature(image);
    saveSignatureToCache(signature);
  }, [createImageSignature, saveSignatureToCache, enabled]);

  /**
   * مسح ذاكرة التخزين المؤقت
   */
  const clearCache = useCallback((): void => {
    cachedSignaturesRef.current.clear();
    localStorage.removeItem(LOCAL_STORAGE_KEY_DUPLICATES);
    
    toast({
      title: "تم مسح ذاكرة التخزين المؤقت",
      description: "تم مسح جميع سجلات الصور المعالجة من الذاكرة المؤقتة"
    });
  }, [toast]);

  return {
    isDuplicateImage,
    checkDuplicateImage,
    markImageAsProcessed,
    clearCache,
    createImageSignature
  };
}
