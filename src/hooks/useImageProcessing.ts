
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
  
  // إضافة استخدام وظيفة اكتشاف التكرار مع خيارات أكثر تشددًا
  const { isDuplicateImage, clearProcessedHashesCache } = useDuplicateDetection({
    enabled: true,
    ignoreTemporary: false  // لا نتجاهل الصور المؤقتة لتحسين اكتشاف التكرار
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
  
  // وظيفة لمعالجة صورة واحدة مع تحسين اكتشاف التكرار
  const processImage = async (image: ImageData): Promise<ImageData> => {
    try {
      console.log(`بدء معالجة الصورة ${image.id} بالحالة ${image.status}`);
      
      // التحقق من أن الصورة ليست في حالة "مكتملة" أو "خطأ"
      if (image.status === "completed" || image.status === "error") {
        console.log(`تخطي معالجة الصورة ${image.id} لأنها بالفعل في حالة ${image.status}`);
        return image;
      }
      
      // التحقق من وجود نص مستخرج بالفعل
      if (image.extractedText && image.extractedText.length > 10 && 
          image.extractedText !== "جاري تحميل الصورة وتحسينها..." && 
          image.extractedText !== "جاري معالجة الصورة واستخراج البيانات...") {
        console.log(`الصورة ${image.id} لديها بالفعل نص مستخرج: ${image.extractedText.substring(0, 20)}...`);
        
        // إذا كان لديها أيضًا البيانات الأساسية، نعتبرها مكتملة
        if (image.code && image.senderName && image.phoneNumber) {
          console.log(`الصورة ${image.id} لديها بالفعل البيانات الأساسية، تحديثها إلى مكتملة`);
          
          // تحديث الحالة إلى مكتملة
          const completedImage = {
            ...image,
            status: "completed" as const
          };
          
          // تحديث الصورة في الحالة
          coreProcessing.updateImage(image.id, { status: "completed" });
          
          return completedImage;
        }
      }
      
      // فحص ما إذا كانت الصورة مكررة قبل معالجتها
      if (isDuplicateImage(image, coreProcessing.images)) {
        console.log("تم اكتشاف صورة مكررة:", image.id);
        toast({
          title: "صورة مكررة",
          description: "تم تخطي هذه الصورة لأنها مكررة أو تمت معالجتها بالفعل"
        });
        
        return {
          ...image,
          status: "completed" as const,
          error: "هذه الصورة تمت معالجتها بالفعل"
        };
      }
      
      try {
        // معالجة الصورة فقط إذا لم تكن مكتملة أو بها خطأ
        const processedImage = await coreProcessing.saveProcessedImage(image);
        
        console.log(`تمت معالجة الصورة ${image.id} بنجاح، الحالة الجديدة: ${processedImage.status}`);
        return processedImage;
      } catch (processingError) {
        console.error("خطأ أثناء معالجة الصورة:", processingError);
        return { 
          ...image, 
          status: "error" as const, 
          error: "فشل في معالجة الصورة" 
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
    console.log(`بدء معالجة ${images.length} صور`);
    
    // تصفية الصور للاحتفاظ فقط بالصور الفريدة وغير المعالجة بالفعل
    const uniqueImages = images.filter(image => {
      // استبعاد الصور المكتملة أو التي بها أخطاء
      if (image.status === "completed" || image.status === "error") {
        console.log(`تخطي صورة مكتملة/خطأ: ${image.id} (${image.status})`);
        return false;
      }
      
      // التحقق من أن الصورة ليست مكررة
      const duplicate = isDuplicateImage(image, coreProcessing.images);
      if (duplicate) {
        console.log(`تخطي صورة مكررة: ${image.id}`);
      }
      return !duplicate;
    });
    
    console.log(`معالجة ${uniqueImages.length} من ${images.length} صور (تم تخطي ${images.length - uniqueImages.length} صور مكررة أو مكتملة)`);
    
    // معالجة الصور الفريدة فقط
    for (const image of uniqueImages) {
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
    clearProcessedHashesCache
  };
};
