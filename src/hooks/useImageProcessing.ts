
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
    console.log(`تسجيل الصورة ${image.id} كمعالجة`);
    
    // تسجيل الصورة كمعالجة بغض النظر عن حالتها (نجاح أو فشل)
    markImageAsProcessed(image);
    return true;
  }, [markImageAsProcessed]);

  // وظيفة لمعالجة صورة واحدة مع اكتشاف التكرار محسن
  const processImage = async (image: ImageData): Promise<ImageData> => {
    try {
      // التحقق من اكتمال الصورة أولاً - تم تحسين دالة isFullyProcessed 
      if (isFullyProcessed(image)) {
        console.log(`الصورة ${image.id} مكتملة المعالجة بالفعل، تخطي المعالجة`);
        return image;
      }
      
      // فحص ما إذا كانت الصورة مكررة قبل معالجتها
      if (isDuplicateImage(image, coreProcessing.images)) {
        console.log("تم اكتشاف صورة مكررة:", image.id);
        
        // تسجيل الصورة كمعالجة رغم أنها مكررة
        trackProcessedImage(image);
        
        return {
          ...image,
          status: "error" as const,
          error: "هذه الصورة مكررة وتم تخطيها"
        };
      }
      
      try {
        console.log(`بدء معالجة الصورة: ${image.id}`);
        
        // معالجة الصورة - معالجة القيمة الفارغة التي قد ترجعها saveProcessedImage
        try {
          await coreProcessing.saveProcessedImage(image);
        } catch (saveError) {
          console.error("خطأ في حفظ الصورة المعالجة:", saveError);
          throw new Error(`فشل في معالجة الصورة: ${saveError.message || 'خطأ غير معروف'}`);
        }
        
        // بعد المعالجة، نحاول العثور على الصورة المحدثة في القائمة
        const updatedImage = coreProcessing.images.find(img => img.id === image.id);
        
        if (updatedImage) {
          // تسجيل الصورة كمعالجة في جميع الحالات (نجاح أو فشل)
          trackProcessedImage(updatedImage);
          
          console.log(`تم الانتهاء من معالجة الصورة ${image.id} بحالة: ${updatedImage.status}`);
          return updatedImage;
        }
        
        // إذا لم نتمكن من العثور على الصورة المحدثة، نسجل الصورة الأصلية كمعالجة
        trackProcessedImage(image);
        
        // إرجاع الصورة الأصلية إذا لم نتمكن من العثور على نسخة محدثة
        return image;
      } catch (processingError) {
        console.error("خطأ أثناء معالجة الصورة:", processingError);
        
        // تحديث الصورة بحالة الخطأ وتسجيلها كمعالجة لتجنب إعادة المحاولة
        const errorImage = { 
          ...image, 
          status: "error" as const, 
          error: processingError.message || "فشل في حفظ الصورة المعالجة" 
        };
        
        // تسجيل الصورة كمعالجة حتى في حالة الخطأ
        trackProcessedImage(errorImage);
        
        return errorImage;
      }
    } catch (error) {
      console.error("خطأ في معالجة الصورة:", error);
      
      const errorImage = {
        ...image,
        status: "error" as const,
        error: error.message || "حدث خطأ أثناء معالجة الصورة"
      };
      
      // تسجيل الصورة كمعالجة حتى في حالة الخطأ
      trackProcessedImage(errorImage);
      
      return errorImage;
    }
  };

  // وظيفة لمعالجة مجموعة من الصور
  const processMultipleImages = async (images: ImageData[]): Promise<void> => {
    for (const image of images) {
      // تخطي الصور المكتملة المعالجة - تم تحسين دالة isFullyProcessed
      if (isFullyProcessed(image)) {
        console.log(`تخطي الصورة المكتملة المعالجة: ${image.id}`);
        continue;
      }
      
      await processImage(image);
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
    isFullyProcessed
  };
};
