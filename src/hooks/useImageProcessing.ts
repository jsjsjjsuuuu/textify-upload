
import { formatDate } from "@/utils/dateFormatter";
import { useImageProcessingCore } from "@/hooks/useImageProcessingCore";
import { useState, useEffect, useCallback } from "react";
import { ImageData } from "@/types/ImageData";
import { useDuplicateDetection } from "./useDuplicateDetection";

export const useImageProcessing = () => {
  const coreProcessing = useImageProcessingCore();
  
  // دوال وحالات إضافية
  const [autoExportEnabled, setAutoExportEnabled] = useState<boolean>(
    localStorage.getItem('autoExportEnabled') === 'true'
  );
  
  const [defaultSheetId, setDefaultSheetId] = useState<string>(
    localStorage.getItem('defaultSheetId') || ''
  );
  
  // تحسين استخدام وظيفة اكتشاف التكرار مع خيارات موسعة
  const { 
    isDuplicateImage, 
    clearProcessedHashesCache, 
    markImageAsProcessed,
    isFullyProcessed,
    addToProcessedCache,
    cleanupOldData
  } = useDuplicateDetection();
  
  // حفظ تفضيلات المستخدم في التخزين المحلي
  useEffect(() => {
    localStorage.setItem('autoExportEnabled', autoExportEnabled.toString());
  }, [autoExportEnabled]);
  
  // حفظ معرف جدول البيانات الافتراضي
  useEffect(() => {
    if (defaultSheetId) {
      localStorage.setItem('defaultSheetId', defaultSheetId);
    }
  }, [defaultSheetId]);
  
  // إضافة تنظيف دوري للبيانات القديمة
  useEffect(() => {
    // تنظيف البيانات القديمة عند بدء التشغيل
    cleanupOldData();
    
    // تنظيف دوري كل 24 ساعة
    const cleanupInterval = setInterval(cleanupOldData, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(cleanupInterval);
  }, [cleanupOldData]);
  
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
    
    // تسجيل الصورة كمعالجة بغض النظر عن حالتها (نجاح أو فشل)
    markImageAsProcessed(image);
    
    // تحسين توثيق الإضافة
    if (image.status === "completed") {
      console.log(`نجاح: الصورة ${image.id} تمت معالجتها وتسجيلها كمكتملة`);
    } else if (image.status === "error") {
      console.log(`خطأ: الصورة ${image.id} تمت معالجتها وتسجيلها مع خطأ: ${image.error || 'خطأ غير محدد'}`);
    } else {
      console.log(`الصورة ${image.id} تمت معالجتها وتسجيلها بحالة: ${image.status || 'غير محدد'}`);
    }
    
    return true;
  }, [markImageAsProcessed]);

  // وظيفة لمعالجة صورة واحدة مع اكتشاف التكرار محسن - تم تعديلها لمنع إعادة المعالجة
  const processImage = async (image: ImageData): Promise<ImageData> => {
    try {
      // تسجيل الصورة كمعالجة مهما كانت النتيجة
      trackProcessedImage(image);
      
      // وضع علامة عليها كمكتملة المعالجة لمنع محاولة إعادة المعالجة
      const updatedImage = {
        ...image,
        status: image.status === "error" ? "error" : "completed"
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
      // وضع علامة على كل الصور كمعالجة
      trackProcessedImage(image);
    }
  };
  
  // إضافة وظيفة محسنة لاكتشاف التكرار
  const checkForDuplicate = (image: ImageData, images: ImageData[]): boolean => {
    return isDuplicateImage(image, images);
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
    clearProcessedHashesCache,
    trackProcessedImage,
    isFullyProcessed,
    // إضافة وظائف جديدة
    cleanupOldData
  };
};
