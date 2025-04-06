
import { formatDate } from "@/utils/dateFormatter";
import { useImageProcessingCore } from "@/hooks/useImageProcessingCore";
import { useState, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import { useDuplicateDetection } from "./useDuplicateDetection";
import { useToast } from "@/hooks/use-toast";

export const useImageProcessing = () => {
  const coreProcessing = useImageProcessingCore();
  const { toast } = useToast();
  
  // دوال وحالات إضافية
  const [autoExportEnabled, setAutoExportEnabled] = useState<boolean>(
    localStorage.getItem('autoExportEnabled') === 'true'
  );
  
  const [defaultSheetId, setDefaultSheetId] = useState<string>(
    localStorage.getItem('defaultSheetId') || ''
  );
  
  // إضافة استخدام وظيفة اكتشاف التكرار
  const { isDuplicateImage, clearProcessedHashesCache } = useDuplicateDetection({
    enabled: true,
    ignoreTemporary: false  // لا نتجاهل الصور المؤقتة لتجنب التكرار
  });
  
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
  
  // وظيفة لمعالجة صورة واحدة مع اكتشاف التكرار
  const processImage = async (image: ImageData): Promise<ImageData> => {
    try {
      // التحقق من أن الصورة ليست في حالة "مكتملة" أو "خطأ"
      if (image.status === "completed" || image.status === "error") {
        console.log(`تخطي معالجة الصورة ${image.id} لأنها بالفعل في حالة ${image.status}`);
        return image;
      }
      
      // فحص ما إذا كانت الصورة مكررة قبل معالجتها
      if (isDuplicateImage(image, coreProcessing.images)) {
        console.log("تم اكتشاف صورة مكررة:", image.id);
        toast({
          title: "صورة مكررة",
          description: "تم تخطي هذه الصورة لأنها مكررة"
        });
        
        return {
          ...image,
          status: "error" as const,
          error: "هذه الصورة مكررة وتم تخطيها"
        };
      }
      
      // التحقق إذا كانت الصورة لديها بالفعل نص مستخرج
      if (image.extractedText && image.extractedText.trim().length > 0) {
        console.log(`الصورة ${image.id} لديها بالفعل نص مستخرج، تخطي استخراج النص مرة أخرى`);
      }
      
      try {
        // معالجة الصورة فقط إذا لم تكن مكتملة أو بها خطأ
        const processedImage = await coreProcessing.saveProcessedImage(image);
        
        // التعامل مع حالة عدم وجود قيمة عائدة من saveProcessedImage
        if (!processedImage) {
          // نستخدم حالة الخطأ ونضيف رسالة
          return {
            ...image,
            status: "error" as const,
            error: "فشل في معالجة الصورة"
          };
        }
        
        return processedImage;
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
    // تصفية الصور للاحتفاظ فقط بالصور الفريدة وغير المعالجة بالفعل
    const uniqueImages = images.filter(image => 
      // استبعاد الصور المكتملة أو التي بها أخطاء
      image.status !== "completed" && image.status !== "error" && 
      // التحقق من أن الصورة ليست مكررة
      !isDuplicateImage(image, coreProcessing.images)
    );
    
    console.log(`معالجة ${uniqueImages.length} من ${images.length} صور (تم تخطي ${images.length - uniqueImages.length} صور مكررة أو مكتملة)`);
    
    // معالجة الصور الفريدة فقط
    for (const image of uniqueImages) {
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
    clearProcessedHashesCache
  };
};
