
import { formatDate } from "@/utils/dateFormatter";
import { useImageProcessingCore } from "@/hooks/useImageProcessingCore";
import { useState, useEffect, useCallback } from "react";
import { ImageData } from "@/types/ImageData";
import { useDuplicateDetection } from "./useDuplicateDetection";

// المفتاح الموحد للتخزين المحلي
const AUTO_EXPORT_KEY = 'autoExportEnabled';
const DEFAULT_SHEET_ID_KEY = 'defaultSheetId';

export const useImageProcessing = () => {
  const coreProcessing = useImageProcessingCore();
  
  // دوال وحالات إضافية
  const [autoExportEnabled, setAutoExportEnabled] = useState<boolean>(
    localStorage.getItem(AUTO_EXPORT_KEY) === 'true'
  );
  
  const [defaultSheetId, setDefaultSheetId] = useState<string>(
    localStorage.getItem(DEFAULT_SHEET_ID_KEY) || ''
  );
  
  // تحسين استخدام وظيفة اكتشاف التكرار مع خيارات موسعة
  const duplicateDetection = useDuplicateDetection({ 
    enabled: true,
    ignoreTemporary: false // نفحص جميع الصور بما في ذلك المؤقتة
  });
  
  // حفظ تفضيلات المستخدم في التخزين المحلي الموحد
  useEffect(() => {
    localStorage.setItem(AUTO_EXPORT_KEY, autoExportEnabled.toString());
  }, [autoExportEnabled]);
  
  // حفظ معرف جدول البيانات الافتراضي
  useEffect(() => {
    if (defaultSheetId) {
      localStorage.setItem(DEFAULT_SHEET_ID_KEY, defaultSheetId);
    }
  }, [defaultSheetId]);
  
  // إضافة تنظيف دوري للبيانات القديمة
  useEffect(() => {
    // تنظيف البيانات القديمة عند بدء التشغيل
    duplicateDetection.cleanupOldData();
    
    // تنظيف دوري كل 24 ساعة
    const cleanupInterval = setInterval(duplicateDetection.cleanupOldData, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(cleanupInterval);
  }, [duplicateDetection.cleanupOldData]);
  
  // تفعيل/تعطيل التصدير التلقائي
  const toggleAutoExport = (value: boolean) => {
    setAutoExportEnabled(value);
  };
  
  // تعيين جدول البيانات الافتراضي
  const setDefaultSheet = (sheetId: string) => {
    setDefaultSheetId(sheetId);
  };
  
  // وظيفة محسنة لتسجيل الصور المعالجة مع تحسين التوثيق
  const trackProcessedImage = useCallback((image: ImageData) => {
    if (!image || !image.id) {
      console.error("محاولة تسجيل صورة غير صالحة");
      return false;
    }
    
    console.log(`تسجيل الصورة ${image.id} (${image.file?.name || 'بدون اسم ملف'}) كمعالجة`);
    
    // تسجيل الصورة كمعالجة في نظام اكتشاف التكرار الموحد
    duplicateDetection.markImageAsProcessed(image);
    
    // تحسين توثيق الإضافة
    if (image.status === "completed") {
      console.log(`نجاح: الصورة ${image.id} تمت معالجتها وتسجيلها كمكتملة`);
    } else if (image.status === "error") {
      console.log(`خطأ: الصورة ${image.id} تمت معالجتها وتسجيلها مع خطأ: ${image.error || 'خطأ غير محدد'}`);
    } else {
      console.log(`الصورة ${image.id} تمت معالجتها وتسجيلها بحالة: ${image.status || 'غير محدد'}`);
    }
    
    return true;
  }, [duplicateDetection]);

  // وظيفة لمعالجة صورة واحدة - آلية منع إعادة المعالجة
  const processImage = async (image: ImageData): Promise<ImageData> => {
    try {
      // تسجيل الصورة كمعالجة قبل أي شيء
      trackProcessedImage(image);
      
      // وضع علامة عليها كمكتملة المعالجة لمنع محاولة إعادة المعالجة
      const updatedImage = {
        ...image,
        status: image.status === "error" ? "error" as const : "completed" as const
      };
      
      // تحديث الصورة في القائمة
      const existingImageIndex = coreProcessing.images.findIndex(img => img.id === image.id);
      if (existingImageIndex >= 0) {
        // استخدام وظيفة updateImage من coreProcessing
        coreProcessing.handleTextChange(image.id, "status", updatedImage.status);
      }
      
      return updatedImage;
    } catch (error) {
      console.error("خطأ في معالجة الصورة:", error);
      
      // وضع علامة عليها كمكتملة المعالجة مع خطأ
      const errorImage = {
        ...image,
        status: "error" as const,
        error: "تم تعطيل نظام إعادة المعالجة"
      };
      
      // تسجيلها كمعالجة
      trackProcessedImage(errorImage);
      
      return errorImage;
    }
  };

  // وظيفة لمعالجة مجموعة من الصور مع تجاهل المكررات والمكتملة
  const processMultipleImages = async (images: ImageData[]): Promise<void> => {
    for (const image of images) {
      // تسجيل كل الصور مباشرة كمعالجة
      trackProcessedImage(image);
    }
  };
  
  // إضافة وظيفة للتحقق من تكرار الصور
  const checkForDuplicate = (image: ImageData, images: ImageData[]): boolean => {
    return duplicateDetection.isDuplicateImage(image, images);
  };

  return {
    ...coreProcessing,
    formatDate,
    autoExportEnabled,
    defaultSheetId,
    toggleAutoExport,
    setDefaultSheet,
    runCleanupNow: coreProcessing.runCleanupNow,
    processImage,
    processMultipleImages,
    isDuplicateImage: checkForDuplicate,
    clearProcessedHashesCache: duplicateDetection.clearProcessedHashesCache,
    trackProcessedImage,
    isFullyProcessed: duplicateDetection.isFullyProcessed,
    // إضافة وظائف التنظيف
    cleanupOldData: duplicateDetection.cleanupOldData,
    resetCaches: duplicateDetection.resetLocalStorage
  };
};
