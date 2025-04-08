
import { useState, useEffect, useCallback } from 'react';
import { ImageData } from '@/types/ImageData';

interface DuplicateDetectorOptions {
  // خيارات لتخصيص طريقة اكتشاف التكرار
  enabled?: boolean;
  saveToLocalStorage?: boolean;
  compareContent?: boolean;
}

export function useDuplicateDetector(options?: DuplicateDetectorOptions) {
  // الخيارات الافتراضية
  const {
    enabled = true,
    saveToLocalStorage = true,
    compareContent = true
  } = options || {};

  // حالة التخزين المؤقت لتخزين بصمات الصور المعالجة
  const [processedHashes, setProcessedHashes] = useState<Set<string>>(new Set());
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());
  const [hashCounter, setHashCounter] = useState(0);
  const [idCounter, setIdCounter] = useState(0);

  // تحميل البصمات المخزنة مسبقًا من التخزين المحلي عند التهيئة
  useEffect(() => {
    if (saveToLocalStorage && enabled) {
      try {
        const savedHashes = localStorage.getItem('image_hashes');
        const savedIds = localStorage.getItem('image_ids');
        
        if (savedHashes) {
          const parsedHashes = JSON.parse(savedHashes);
          setProcessedHashes(new Set(parsedHashes));
          setHashCounter(parsedHashes.length);
        }
        
        if (savedIds) {
          const parsedIds = JSON.parse(savedIds);
          setProcessedIds(new Set(parsedIds));
          setIdCounter(parsedIds.length);
        }
      } catch (error) {
        console.error('خطأ في استعادة بصمات الصور من التخزين المحلي:', error);
      }
    }
  }, [saveToLocalStorage, enabled]);

  // حفظ البصمات في التخزين المحلي عند تغييرها
  useEffect(() => {
    if (saveToLocalStorage && enabled && (hashCounter > 0 || idCounter > 0)) {
      try {
        localStorage.setItem('image_hashes', JSON.stringify(Array.from(processedHashes)));
        localStorage.setItem('image_ids', JSON.stringify(Array.from(processedIds)));
      } catch (error) {
        console.error('خطأ في حفظ بصمات الصور في التخزين المحلي:', error);
      }
    }
  }, [processedHashes, processedIds, hashCounter, idCounter, saveToLocalStorage, enabled]);

  // إنشاء بصمة للصورة - تصحيح التعامل مع الأنواع المختلفة
  const createImageHash = useCallback((input: ImageData | File): string => {
    // إذا كان الإدخال من نوع ImageData
    if ('id' in input) {
      if (input.storage_path) {
        return `path:${input.storage_path}`;
      } else if (input.previewUrl) {
        return `url:${input.previewUrl}`;
      } else if (input.file && input.file.name) {
        return `file:${input.file.name}:${input.file.size}:${input.file.lastModified || ''}`;
      } else {
        return `id:${input.id}`;
      }
    } 
    // إذا كان الإدخال من نوع File
    else {
      return `file:${input.name}:${input.size}:${input.lastModified || ''}`;
    }
  }, []);

  // التحقق مما إذا كانت الصورة مكررة
  const isDuplicateImage = useCallback((input: ImageData | File, images?: ImageData[]): boolean => {
    if (!enabled) return false;
    
    // تحقق من المعرف أولاً إذا كان من نوع ImageData
    if ('id' in input && input.id && processedIds.has(input.id)) {
      console.log(`الصورة مكررة (بواسطة المعرف): ${input.id}`);
      return true;
    }
    
    // ثم تحقق من بصمة الصورة
    const imageHash = createImageHash(input);
    if (processedHashes.has(imageHash)) {
      console.log(`الصورة مكررة (بواسطة البصمة): ${imageHash}`);
      return true;
    }
    
    // إذا تم تمرير مجموعة صور، تحقق من التكرار في هذه المجموعة أيضًا
    if (compareContent && images && images.length > 0) {
      const isDuplicate = images.some(existingImage => {
        // تخطي المقارنة مع نفس العنصر
        if ('id' in input && input.id === existingImage.id) return false;
        
        // مقارنة الخصائص الأساسية للملف
        if ('file' in input && input.file) {
          return (
            input.file.name === existingImage.file.name && 
            input.file.size === existingImage.file.size
          );
        }
        
        // للمقارنة مع كائن File
        if (!('id' in input) && 'name' in input && 'size' in input) {
          return (
            input.name === existingImage.file.name && 
            input.size === existingImage.file.size
          );
        }
        
        return false;
      });
      
      if (isDuplicate) {
        console.log(`الصورة مكررة (بواسطة مقارنة المحتوى)`);
        return true;
      }
    }
    
    return false;
  }, [enabled, processedIds, processedHashes, createImageHash, compareContent]);

  // وسم صورة كمعالجة
  const markImageAsProcessed = useCallback((input: ImageData | File) => {
    if (!enabled) return;
    
    // إضافة معرّف الصورة إلى قائمة المعرّفات المعالجة
    if ('id' in input) {
      setProcessedIds(prev => {
        const newSet = new Set(prev);
        newSet.add(input.id);
        return newSet;
      });
      setIdCounter(prev => prev + 1);
    }
    
    // إضافة بصمة الصورة إلى قائمة البصمات المعالجة
    const imageHash = createImageHash(input);
    setProcessedHashes(prev => {
      const newSet = new Set(prev);
      newSet.add(imageHash);
      return newSet;
    });
    setHashCounter(prev => prev + 1);
    
    console.log(`تم وسم الصورة كمعالجة: ${imageHash}`);
  }, [enabled, createImageHash]);

  // مسح ذاكرة التخزين المؤقت للبصمات
  const clearProcessedHashesCache = useCallback(() => {
    setProcessedHashes(new Set());
    setProcessedIds(new Set());
    setHashCounter(0);
    setIdCounter(0);
    
    if (saveToLocalStorage) {
      localStorage.removeItem('image_hashes');
      localStorage.removeItem('image_ids');
    }
    
    console.log('تم مسح ذاكرة التخزين المؤقت للبصمات');
  }, [saveToLocalStorage]);

  // حفظ البصمات في التخزين المحلي
  const saveToLocalStorageManually = useCallback(() => {
    if (saveToLocalStorage && enabled) {
      try {
        localStorage.setItem('image_hashes', JSON.stringify(Array.from(processedHashes)));
        localStorage.setItem('image_ids', JSON.stringify(Array.from(processedIds)));
        console.log('تم حفظ البصمات في التخزين المحلي يدويًا');
      } catch (error) {
        console.error('خطأ في حفظ البصمات في التخزين المحلي:', error);
      }
    }
  }, [processedHashes, processedIds, saveToLocalStorage, enabled]);

  return {
    // الدوال الرئيسية
    isDuplicateImage,
    markImageAsProcessed,
    clearProcessedHashesCache,
    
    // إحصائيات
    processedHashesCount: processedHashes.size,
    processedIdsCount: processedIds.size,
    
    // إمكانية التحكم
    isEnabled: enabled,
    
    // الوظائف المساعدة
    getAllProcessedHashes: () => Array.from(processedHashes),
    getAllProcessedIds: () => Array.from(processedIds),
    saveToLocalStorage: saveToLocalStorageManually
  };
}
