
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
  
  // إضافة استخدام وظيفة اكتشاف التكرار مع خيارات موسعة
  const { 
    isDuplicateImage, 
    clearProcessedHashesCache, 
    markImageAsProcessed,
    isFullyProcessed,
    addToProcessedCache
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
  
  // تفعيل/تعطيل التصدير التلقائي
  const toggleAutoExport = (value: boolean) => {
    setAutoExportEnabled(value);
  };
  
  // تعيين جدول البيانات الافتراضي
  const setDefaultSheet = (sheetId: string) => {
    setDefaultSheetId(sheetId);
  };
  
  // وظيفة محسنة لتسجيل الصور المعالجة
  const trackProcessedImage = useCallback((image: ImageData) => {
    if (isFullyProcessed(image)) {
      console.log(`تسجيل الصورة ${image.id} كمعالجة بالكامل`);
      addToProcessedCache(image);
      return true;
    }
    return false;
  }, [isFullyProcessed, addToProcessedCache]);

  // وظيفة لمعالجة صورة واحدة مع اكتشاف التكرار محسن
  const processImage = async (image: ImageData): Promise<ImageData> => {
    try {
      // التحقق من اكتمال الصورة أولاً
      if (isFullyProcessed(image)) {
        console.log(`الصورة ${image.id} مكتملة المعالجة بالفعل، تخطي المعالجة`);
        return image;
      }
      
      // فحص ما إذا كانت الصورة مكررة قبل معالجتها
      if (isDuplicateImage(image, coreProcessing.images)) {
        console.log("تم اكتشاف صورة مكررة:", image.id);
        return {
          ...image,
          status: "error" as const,
          error: "هذه الصورة مكررة وتم تخطيها"
        };
      }
      
      try {
        // معالجة الصورة واستخدام الإرجاع بشكل مباشر
        await coreProcessing.saveProcessedImage(image);
        
        // نحن نعرف أن saveProcessedImage لا ترجع قيمة، لذلك نستخدم الصورة المحدثة
        // من الحالة لتتبع ما إذا كانت المعالجة ناجحة
        const updatedImage = coreProcessing.images.find(img => img.id === image.id);
        
        // إذا تمت المعالجة بنجاح، نسجل الصورة
        if (updatedImage && updatedImage.status === "completed") {
          trackProcessedImage(updatedImage);
          return updatedImage;
        }
        
        // إذا لم نتمكن من العثور على الصورة المحدثة أو كان هناك خطأ
        return {
          ...image,
          status: "error" as const,
          error: "فشل في معالجة الصورة"
        };
      } catch (processingError) {
        console.error("خطأ أثناء معالجة الصورة:", processingError);
        return { 
          ...image, 
          status: "error" as const, 
          error: "فشل في حفظ الصورة المعالجة" 
        };
      }
    } catch (error) {
      console.error("خطأ في معالجة الصورة:", error);
      return {
        ...image,
        status: "error" as const,
        error: "حدث خطأ أثناء معالجة الصورة"
      };
    }
  };

  // وظيفة لمعالجة مجموعة من الصور
  const processMultipleImages = async (images: ImageData[]): Promise<void> => {
    for (const image of images) {
      // تخطي الصور المكتملة المعالجة
      if (isFullyProcessed(image)) {
        console.log(`تخطي الصورة المكتملة المعالجة: ${image.id}`);
        continue;
      }
      
      await processImage(image);
    }
  };
  
  // إضافة وظيفة محسنة لاكتشاف التكرار - تأكد من أن الوظيفة ترجع قيمة boolean
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
    isFullyProcessed
  };
};
