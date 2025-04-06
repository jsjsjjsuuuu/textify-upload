
import { useState, useCallback, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import { useGeminiProcessing } from "./useGeminiProcessing";
import { useStorage, STORAGE_BUCKETS } from "./useStorage";
import { calculateImageHash, readImageFile } from "@/utils/fileReader";
import { isDuplicateImage, markImageAsProcessed, loadProcessedHashesFromStorage } from "@/utils/duplicateDetection";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface UseImageProcessingProps {
  updateImage: (id: string, data: Partial<ImageData>) => void;
  saveImage: (image: ImageData) => Promise<void>;
  allImages: ImageData[];
}

export const useImageProcessing = ({ updateImage, saveImage, allImages }: UseImageProcessingProps) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentlyProcessingId, setCurrentlyProcessingId] = useState<string | null>(null);
  const { processWithGemini } = useGeminiProcessing();
  const { uploadFile } = useStorage();
  
  // تحميل هاشات الصور المعالجة عند التهيئة
  useEffect(() => {
    loadProcessedHashesFromStorage();
  }, []);

  // معالجة صورة واحدة
  const processImage = useCallback(async (image: ImageData): Promise<ImageData> => {
    try {
      console.log(`بدء معالجة الصورة: ${image.id}`);
      
      // تحقق مما إذا كانت الصورة قد تمت معالجتها بالفعل
      if (image.processed) {
        console.log(`تم تخطي الصورة ${image.id} لأنها تمت معالجتها بالفعل`);
        return image;
      }
      
      // تحقق من التكرار قبل المعالجة
      const isDuplicate = await isDuplicateImage(image, allImages);
      if (isDuplicate) {
        console.log(`تم تخطي الصورة ${image.id} لأنها مكررة`);
        return {
          ...image,
          status: "completed" as "completed",
          processed: true,
          error: "تم تخطي المعالجة لأن الصورة مكررة"
        };
      }
      
      // تحديث حالة الصورة إلى "جاري المعالجة"
      updateImage(image.id, {
        status: "processing",
        extractedText: "جاري استخراج النص من الصورة...",
        processingAttempts: (image.processingAttempts || 0) + 1
      });
      
      setIsProcessing(true);
      setCurrentlyProcessingId(image.id);
      
      // التحقق من وجود الملف
      if (!image.file) {
        throw new Error("ملف الصورة غير متاح");
      }
      
      // حساب هاش الصورة إذا لم يكن موجوداً
      if (!image.imageHash) {
        image.imageHash = await calculateImageHash(image.file);
      }
      
      // رفع الصورة إلى التخزين إذا كان هناك مستخدم مسجل
      let storageUrl = null;
      const user = await supabase.auth.getUser();
      
      if (user.data.user) {
        const userId = user.data.user.id;
        const timestamp = Date.now();
        const fileExt = image.file.name.split('.').pop();
        const filePath = `${userId}/${image.id}_${timestamp}.${fileExt}`;
        
        storageUrl = await uploadFile(image.file, STORAGE_BUCKETS.IMAGES, filePath);
        if (storageUrl) {
          updateImage(image.id, {
            storage_path: filePath
          });
        }
      }
      
      // معالجة الصورة باستخدام Gemini
      let processedImage = await processWithGemini(image.file, image);
      
      // تضمين معلومات التخزين في النتيجة
      if (storageUrl) {
        processedImage.storage_path = storageUrl;
      }
      
      // وضع علامة على الصورة بأنها تمت معالجتها
      processedImage.processed = true;
      processedImage.processingAttempts = (image.processingAttempts || 0) + 1;
      
      // إضافة الهاش إلى كاش الصور المعالجة
      if (processedImage.imageHash) {
        markImageAsProcessed(processedImage.imageHash);
      }
      
      // تحديث الواجهة بالبيانات المستخرجة
      updateImage(image.id, {
        status: processedImage.status,
        code: processedImage.code,
        senderName: processedImage.senderName,
        phoneNumber: processedImage.phoneNumber,
        province: processedImage.province,
        price: processedImage.price,
        companyName: processedImage.companyName,
        extractedText: processedImage.extractedText,
        confidence: processedImage.confidence,
        processed: true,
        storage_path: processedImage.storage_path
      });
      
      // حفظ البيانات في قاعدة البيانات
      try {
        await saveImage(processedImage);
      } catch (saveError) {
        console.error(`خطأ في حفظ الصورة ${image.id}:`, saveError);
      }
      
      console.log(`تمت معالجة الصورة ${image.id} بنجاح`);
      return processedImage;
      
    } catch (error: any) {
      console.error(`خطأ في معالجة الصورة ${image.id}:`, error);
      
      updateImage(image.id, {
        status: "error",
        error: error.message || "خطأ غير معروف",
        extractedText: `فشل المعالجة: ${error.message || "خطأ غير معروف"}`
      });
      
      return {
        ...image,
        status: "error" as "error",
        error: error.message || "خطأ غير معروف"
      };
    } finally {
      setIsProcessing(false);
      setCurrentlyProcessingId(null);
    }
  }, [updateImage, saveImage, allImages, processWithGemini, uploadFile]);

  // معالجة مجموعة من الصور
  const processMultipleImages = useCallback(async (images: ImageData[]): Promise<void> => {
    if (images.length === 0) return;
    
    const imagesToProcess = images.filter(img => !img.processed);
    if (imagesToProcess.length === 0) {
      console.log("لا توجد صور جديدة للمعالجة");
      toast.info("لا توجد صور جديدة للمعالجة");
      return;
    }
    
    toast.info(`جاري معالجة ${imagesToProcess.length} صور...`, {
      duration: 3000
    });
    
    for (const image of imagesToProcess) {
      try {
        await processImage(image);
        // إضافة تأخير بين المعالجات لتجنب تجاوز حدود API
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`خطأ في معالجة الصورة ${image.id}:`, error);
      }
    }
    
    toast.success(`تمت معالجة ${imagesToProcess.length} صور`);
  }, [processImage]);

  return {
    processImage,
    processMultipleImages,
    isProcessing,
    currentlyProcessingId
  };
};
