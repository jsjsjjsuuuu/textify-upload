
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

  // وظيفة لمعالجة صورة واحدة مع اكتشاف التكرار محسن
  const processImage = async (image: ImageData): Promise<ImageData> => {
    try {
      // التحقق بشكل أكثر دقة من اكتمال معالجة الصورة أولاً
      if (isFullyProcessed(image)) {
        console.log(`الصورة ${image.id} (${image.file?.name || 'بدون اسم ملف'}) مكتملة المعالجة بالفعل، تخطي المعالجة`);
        return image;
      }
      
      // التحقق بشكل أكثر دقة مما إذا كانت الصورة مكررة مع تحسين القدرة على اكتشاف التكرار
      if (isDuplicateImage(image, coreProcessing.images)) {
        console.log("تم اكتشاف صورة مكررة:", image.id, image.file?.name);
        
        // تسجيل الصورة كمعالجة رغم أنها مكررة للتأكد من عدم معالجتها مرة أخرى
        trackProcessedImage(image);
        
        return {
          ...image,
          status: "error" as const,
          error: "هذه الصورة مكررة وتم تخطيها"
        };
      }
      
      try {
        console.log(`بدء معالجة الصورة: ${image.id} (${image.file?.name || 'بدون اسم ملف'})`);
        
        // تسجيل الصورة قبل المعالجة لتجنب المعالجة المتكررة
        addToProcessedCache({
          ...image,
          status: "processing"
        });
        
        // معالجة الصورة - معالجة القيمة الفارغة التي قد ترجعها saveProcessedImage
        try {
          await coreProcessing.saveProcessedImage(image);
        } catch (saveError) {
          console.error("خطأ في حفظ الصورة المعالجة:", saveError);
          
          // تحديث حالة الخطأ وتسجيل الصورة كمعالجة رغم الفشل
          const errorImage = {
            ...image,
            status: "error" as const,
            error: saveError.message || "فشل في معالجة الصورة"
          };
          
          // تسجيل الصورة كمعالجة رغم الفشل
          trackProcessedImage(errorImage);
          
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
        
        // تسجيل الصورة كمعالجة حتى في حالة الخطأ لتجنب معالجتها مرة أخرى
        trackProcessedImage(errorImage);
        
        return errorImage;
      }
    } catch (error) {
      console.error("خطأ عام في معالجة الصورة:", error);
      
      const errorImage = {
        ...image,
        status: "error" as const,
        error: error.message || "حدث خطأ أثناء معالجة الصورة"
      };
      
      // تسجيل الصورة كمعالجة حتى في حالة الخطأ العام
      trackProcessedImage(errorImage);
      
      return errorImage;
    }
  };

  // وظيفة لمعالجة مجموعة من الصور مع تجاهل المكررات والمكتملة
  const processMultipleImages = async (images: ImageData[]): Promise<void> => {
    for (const image of images) {
      // فحص إضافي للتأكد من أن الصورة لم تتم معالجتها أو أنها مكررة
      if (isFullyProcessed(image) || isDuplicateImage(image, coreProcessing.images)) {
        console.log(`تخطي الصورة المكررة أو المكتملة المعالجة: ${image.id} (${image.file?.name || 'بدون اسم ملف'})`);
        
        // تسجيل الصورة كمعالجة للتأكد من عدم معالجتها في المستقبل
        trackProcessedImage(image);
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
    isFullyProcessed,
    // إضافة وظائف جديدة
    cleanupOldData
  };
};
