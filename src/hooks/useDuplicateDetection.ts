
import { useState, useCallback, useEffect } from 'react';
import { ImageData } from '@/types/ImageData';
import { useToast } from '@/hooks/use-toast';
import CryptoJS from 'crypto-js';
import { createImageHash, isImageDuplicate, isFullyProcessed } from '@/utils/duplicateDetection';

interface UseDuplicateDetectionOptions {
  enabled?: boolean;
  ignoreTemporary?: boolean;
}

// تحسين استراتيجية التخزين: تخزين المعرفات والتجزئات وبيانات الصورة المختصرة
interface StoredImageData {
  id: string;
  fileName?: string;
  fileSize?: number;
  hash?: string;
  status?: string;
  dateProcessed: number;
}

// المفتاح الموحد للتخزين المؤقت - استخدام مفتاح واحد عبر التطبيق بأكمله
const PROCESSED_IMAGES_STORAGE_KEY = 'processedUnifiedImageData';
const PROCESSED_IDS_STORAGE_KEY = 'processedUnifiedImageIds';
const PROCESSED_HASHES_STORAGE_KEY = 'processedUnifiedImageHashes';

export const useDuplicateDetection = (options: UseDuplicateDetectionOptions = {}) => {
  const { enabled = true, ignoreTemporary = true } = options;
  const [processedHashes, setProcessedHashes] = useState<Set<string>>(new Set());
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());
  const [processedImageData, setProcessedImageData] = useState<StoredImageData[]>([]);
  const { toast } = useToast();

  // تحسين وظيفة إنشاء تجزئة للصورة
  const createUniqueImageHash = useCallback((image: ImageData): string => {
    if (!image.file) {
      return `id-${image.id || 'unknown'}`;
    }
    
    // إنشاء سلسلة فريدة تتضمن المزيد من المعلومات لتجنب التكرار الكاذب
    const uniqueIdentifiers = [
      image.file.name,
      image.file.size.toString(),
      image.file.lastModified.toString(),
      image.user_id || '',
      image.batch_id || '',
      image.id || ''
    ].join('|');
    
    // استخدام خوارزمية MD5 لإنشاء بصمة للصورة
    return CryptoJS.MD5(uniqueIdentifiers).toString();
  }, []);

  // استعادة بيانات الصور المعالجة من التخزين المحلي عند بدء التشغيل
  useEffect(() => {
    try {
      // استرجاع معرفات الصور المعالجة (موحدة)
      const storedProcessedIds = localStorage.getItem(PROCESSED_IDS_STORAGE_KEY);
      if (storedProcessedIds) {
        const idsArray = JSON.parse(storedProcessedIds);
        setProcessedIds(new Set(idsArray));
        console.log(`تم تحميل ${idsArray.length} معرف صورة معالجة من التخزين المحلي (موحد)`);
      }
      
      // استرجاع تجزئات الصور المعالجة (موحدة)
      const storedProcessedHashes = localStorage.getItem(PROCESSED_HASHES_STORAGE_KEY);
      if (storedProcessedHashes) {
        const hashesArray = JSON.parse(storedProcessedHashes);
        setProcessedHashes(new Set(hashesArray));
        console.log(`تم تحميل ${hashesArray.length} تجزئة صورة معالجة من التخزين المحلي (موحدة)`);
      }
      
      // استرجاع بيانات الصور المعالجة (موحدة)
      const storedImageData = localStorage.getItem(PROCESSED_IMAGES_STORAGE_KEY);
      if (storedImageData) {
        const imageDataArray = JSON.parse(storedImageData);
        setProcessedImageData(imageDataArray);
        console.log(`تم تحميل بيانات ${imageDataArray.length} صورة معالجة من التخزين المحلي (موحدة)`);
      }
      
      // دمج البيانات من المفاتيح القديمة للتوافق مع الإصدارات السابقة
      mergeOldStorageData();
      
      // تنظيف البيانات القديمة (أكثر من 7 أيام)
      cleanupOldData();
    } catch (error) {
      console.error('خطأ في تحميل بيانات الصور المعالجة من التخزين المحلي:', error);
      
      // إعادة تعيين التخزين المحلي في حالة الخطأ
      resetLocalStorage();
    }
  }, []);

  // دمج بيانات التخزين القديمة مع البيانات الموحدة
  const mergeOldStorageData = useCallback(() => {
    try {
      // استرجاع البيانات من المفاتيح القديمة
      const oldIds = localStorage.getItem('processedImageIds');
      const oldHashes = localStorage.getItem('processedImageHashes');
      const oldData = localStorage.getItem('processedImageData');
      const oldSessionIds = localStorage.getItem('processedSessionImageIds');
      
      // دمج المعرفات
      if (oldIds) {
        const oldIdsArray = JSON.parse(oldIds);
        setProcessedIds(prev => {
          const newSet = new Set(prev);
          oldIdsArray.forEach((id: string) => newSet.add(id));
          return newSet;
        });
      }
      
      if (oldSessionIds) {
        const oldSessionIdsArray = JSON.parse(oldSessionIds);
        setProcessedIds(prev => {
          const newSet = new Set(prev);
          oldSessionIdsArray.forEach((id: string) => newSet.add(id));
          return newSet;
        });
      }
      
      // دمج التجزئات
      if (oldHashes) {
        const oldHashesArray = JSON.parse(oldHashes);
        setProcessedHashes(prev => {
          const newSet = new Set(prev);
          oldHashesArray.forEach((hash: string) => newSet.add(hash));
          return newSet;
        });
      }
      
      // دمج بيانات الصور
      if (oldData) {
        const oldDataArray = JSON.parse(oldData) as StoredImageData[];
        setProcessedImageData(prev => {
          // فحص التكرار قبل الإضافة
          const existingIds = new Set(prev.map(item => item.id));
          const newItems = oldDataArray.filter(item => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
      }
      
      // حفظ البيانات المدمجة
      saveToLocalStorage();
      
      // حذف البيانات القديمة بعد دمجها
      localStorage.removeItem('processedImageIds');
      localStorage.removeItem('processedImageHashes');
      localStorage.removeItem('processedImageData');
      localStorage.removeItem('processedSessionImageIds');
      
      console.log('تم دمج بيانات التخزين القديمة مع البيانات الموحدة');
    } catch (error) {
      console.error('خطأ أثناء دمج بيانات التخزين القديمة:', error);
    }
  }, []);

  // إعادة تعيين التخزين المحلي
  const resetLocalStorage = useCallback(() => {
    localStorage.removeItem(PROCESSED_IDS_STORAGE_KEY);
    localStorage.removeItem(PROCESSED_HASHES_STORAGE_KEY);
    localStorage.removeItem(PROCESSED_IMAGES_STORAGE_KEY);
    // حذف المفاتيح القديمة أيضًا
    localStorage.removeItem('processedImageIds');
    localStorage.removeItem('processedImageHashes');
    localStorage.removeItem('processedImageData');
    localStorage.removeItem('processedSessionImageIds');
    
    setProcessedIds(new Set());
    setProcessedHashes(new Set());
    setProcessedImageData([]);
  }, []);

  // حفظ البيانات في التخزين المحلي
  const saveToLocalStorage = useCallback(() => {
    try {
      // حفظ البيانات الموحدة
      localStorage.setItem(PROCESSED_IDS_STORAGE_KEY, JSON.stringify([...processedIds]));
      localStorage.setItem(PROCESSED_HASHES_STORAGE_KEY, JSON.stringify([...processedHashes]));
      localStorage.setItem(PROCESSED_IMAGES_STORAGE_KEY, JSON.stringify(processedImageData));
    } catch (error) {
      console.error('خطأ في حفظ البيانات الموحدة في التخزين المحلي:', error);
    }
  }, [processedIds, processedHashes, processedImageData]);

  // تنظيف البيانات القديمة (أكثر من 7 أيام)
  const cleanupOldData = useCallback(() => {
    try {
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      
      // تنظيف بيانات الصور المعالجة
      const filteredImageData = processedImageData.filter(data => data.dateProcessed > oneWeekAgo);
      
      if (filteredImageData.length < processedImageData.length) {
        console.log(`تم حذف ${processedImageData.length - filteredImageData.length} سجل قديم من بيانات الصور المعالجة`);
        setProcessedImageData(filteredImageData);
        
        // أيضًا تحديث مجموعات المعرفات والتجزئات
        const newIds = new Set(filteredImageData.map(data => data.id));
        const newHashes = new Set(filteredImageData.map(data => data.hash).filter(Boolean));
        
        setProcessedIds(newIds);
        setProcessedHashes(newHashes);
        
        // حفظ البيانات المحدثة
        saveToLocalStorage();
      }
    } catch (error) {
      console.error('خطأ في تنظيف البيانات القديمة:', error);
    }
  }, [processedImageData, saveToLocalStorage]);

  // حفظ بيانات الصور المعالجة في التخزين المحلي عند التغيير
  useEffect(() => {
    saveToLocalStorage();
  }, [processedIds, processedHashes, processedImageData, saveToLocalStorage]);

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

      // إنشاء بيانات الصورة المختصرة
      let imageHash: string | undefined = undefined;
      if (image.file) {
        imageHash = createUniqueImageHash(image);
        // إضافة التجزئة إلى القائمة
        setProcessedHashes(prev => {
          const newSet = new Set(prev);
          newSet.add(imageHash!);
          return newSet;
        });
      }
      
      // إضافة البيانات المختصرة إلى القائمة
      setProcessedImageData(prev => {
        // التحقق مما إذا كانت الصورة موجودة بالفعل
        const existingIndex = prev.findIndex(item => item.id === image.id);
        
        const newImageData: StoredImageData = {
          id: image.id,
          fileName: image.file?.name,
          fileSize: image.file?.size,
          hash: imageHash,
          status: image.status,
          dateProcessed: Date.now()
        };
        
        if (existingIndex >= 0) {
          // تحديث البيانات الموجودة
          const newData = [...prev];
          newData[existingIndex] = newImageData;
          return newData;
        } else {
          // إضافة بيانات جديدة
          return [...prev, newImageData];
        }
      });
      
      // الحفظ مباشرة في localStorage عند إضافة صورة جديدة - منع تأخير الحفظ
      setTimeout(saveToLocalStorage, 0);
    } catch (error) {
      console.error('خطأ في إضافة الصورة إلى ذاكرة التخزين المؤقت:', error);
    }
  }, [createUniqueImageHash, saveToLocalStorage]);

  // التحقق من تكرار الصورة - تحسين المنطق بإضافة التحقق من البيانات المختصرة
  const isDuplicateImage = useCallback((image: ImageData, images: ImageData[] = []): boolean => {
    if (!enabled || !image || !image.id) return false;

    try {
      console.log(`فحص تكرار الصورة: ${image.id} (${image.file?.name || 'بدون اسم ملف'})`);
      
      // فحص المعرف أولاً - وهو الفحص الأسرع
      if (processedIds.has(image.id)) {
        console.log(`تم العثور على معرف مطابق في الذاكرة المؤقتة: ${image.id}`);
        return true;
      }
      
      // فحص بيانات الصورة المختصرة للمطابقات
      if (image.file) {
        const matchingData = processedImageData.find(data => 
          data.fileName === image.file.name && 
          data.fileSize === image.file.size && 
          data.status !== "processing"
        );
        
        if (matchingData) {
          console.log(`تم العثور على مطابقة في بيانات الصورة: ${matchingData.id} (${matchingData.fileName})`);
          // إضافة المعرف الحالي إلى الذاكرة المؤقتة
          addToProcessedCache(image);
          return true;
        }
      }
      
      // فحص التجزئة إذا كانت الصورة تحتوي على ملف
      if (image.file) {
        const imageHash = createUniqueImageHash(image);
        
        if (processedHashes.has(imageHash)) {
          console.log(`تم العثور على تجزئة مطابقة في الذاكرة المؤقتة: ${imageHash} للصورة ${image.id}`);
          // إضافة المعرف الحالي إلى الذاكرة المؤقتة
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
      
      // فحص إضافي في قائمة الصور الحالية
      if (image.file) {
        const matchingImages = images.filter(img => 
          img.id !== image.id && // ليست نفس الصورة
          img.file && 
          img.file.name === image.file.name && 
          img.file.size === image.file.size &&
          (img.status === "completed" || img.status === "error")
        );
        
        if (matchingImages.length > 0) {
          console.log(`تم العثور على صورة مطابقة بنفس الاسم والحجم: ${image.file.name}`);
          
          // تسجيل الصورة الحالية كمعالجة
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
        return true;
      }
      
      // لا يوجد تكرار
      return false;
    } catch (error) {
      console.error('خطأ في اكتشاف تكرار الصورة:', error);
      return false;
    }
  }, [processedHashes, processedIds, processedImageData, createUniqueImageHash, enabled, ignoreTemporary, addToProcessedCache]);

  // التحقق مما إذا كانت الصورة مكتملة المعالجة - تعزيز الفحص باستخدام البيانات المخزنة
  const isFullyProcessedImage = useCallback((image: ImageData): boolean => {
    // اعتبار الصورة معالجة في الحالات التالية:
    
    // 1. إذا كان معرفها موجوداً في قائمة المعرفات المعالجة
    if (image.id && processedIds.has(image.id)) {
      return true;
    }
    
    // 2. التحقق من وجودها في بيانات الصور المختصرة المعالجة
    const storedImage = processedImageData.find(data => data.id === image.id);
    if (storedImage && storedImage.status !== "processing") {
      return true;
    }
    
    // 3. اعتبار الصورة معالجة إذا كانت حالتها مكتملة أو خطأ وتحتوي على نص مستخرج
    const hasBeenProcessed = (
      (image.status === "completed" || image.status === "error") && 
      !!image.extractedText
    );
    
    // 4. فحص إضافي: إذا كانت الصورة تحتوي على البيانات الأساسية
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
    
    // 5. فحص إضافي للتجزئة إذا كانت الصورة تحتوي على ملف
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
    
    // استخدام الوظيفة الخارجية للتحقق من اكتمال معالجة الصورة
    return isFullyProcessed(image);
  }, [processedIds, processedHashes, processedImageData, createUniqueImageHash, addToProcessedCache]);

  // تسجيل صورة كمعالجة بالكامل - تحسين التوثيق والإضافة إلى البيانات المخزنة
  const markImageAsProcessed = useCallback((image: ImageData): boolean => {
    if (!image || !image.id) {
      console.error('محاولة تسجيل صورة غير صالحة كمعالجة');
      return false;
    }
    
    // تسجيل الصورة كمعالجة بغض النظر عن حالتها
    console.log(`تسجيل الصورة ${image.id} كمعالجة بالكامل (${image.status || 'غير معروف'})`);
    
    // إضافة الصورة إلى الذاكرة المؤقتة مع تفاصيل إضافية للتوثيق
    addToProcessedCache(image);
    
    // إضافة سجل توضيحي
    console.log(`تم تسجيل الصورة ${image.id} (${image.file?.name || 'بدون اسم ملف'}) كمعالجة بالكامل`);
    
    return true;
  }, [addToProcessedCache]);

  // مسح ذاكرة التخزين المؤقت للتجزئات - مع تحسين التنظيف والتوثيق
  const clearProcessedHashesCache = useCallback(() => {
    console.log('تم مسح ذاكرة التخزين المؤقت لتجزئات الصور');
    
    // إعادة تعيين الحالات
    setProcessedHashes(new Set());
    setProcessedIds(new Set());
    setProcessedImageData([]);
    
    // تنظيف التخزين المحلي
    resetLocalStorage();
    
    toast({
      title: "تم مسح الذاكرة المؤقتة",
      description: "تم مسح ذاكرة التخزين المؤقت لاكتشاف الصور المكررة"
    });
  }, [toast, resetLocalStorage]);

  return {
    isDuplicateImage,
    clearProcessedHashesCache,
    processedHashesCount: processedHashes.size,
    processedIdsCount: processedIds.size,
    processedImagesCount: processedImageData.length,
    markImageAsProcessed,
    isFullyProcessed: isFullyProcessedImage,
    addToProcessedCache,
    cleanupOldData,
    // إضافة وظائف جديدة
    resetLocalStorage,
    saveToLocalStorage
  };
};
