import { useState } from "react";
import { useFileProcessing } from "../useFileProcessing";
import { useOcrProcessing } from "../useOcrProcessing";
import { useGeminiProcessing } from "../useGeminiProcessing";
import { formatDate } from "@/utils/dateFormatter";
import { useImageState } from "../imageState";
import { useImageDatabase } from "../useImageDatabase";
import { useToast } from "../use-toast";
import { useDuplicateDetection } from "../useDuplicateDetection";
import { useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ImageData, CustomImageData, ImageProcessFn, FileImageProcessFn } from "@/types/ImageData";

export const useImageProcessing = () => {
  // توابع المعالجة الرئيسية من الهوكس الخاصة
  const { user } = useAuth();
  const { toast } = useToast();
  
  // حالة التحميل
  const [isLoadingUserImages, setIsLoadingUserImages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
  
  // استيراد حالة الصور
  const { 
    images, 
    hiddenImageIds,
    addImage, 
    updateImage, 
    deleteImage, 
    handleTextChange,
    clearSessionImages,
    hideImage,
    unhideImage,
    unhideAllImages,
    getHiddenImageIds,
    setAllImages,
    createSafeObjectURL // استخدام الدالة المصدرة من useImageState
  } = useImageState();
  
  // استيراد معالجات OCR و Gemini
  const { processWithOcr: originalOcrProcess, processFileWithOcr } = useOcrProcessing();
  const { processWithGemini: originalGeminiProcess, processFileWithGemini } = useGeminiProcessing();

  // دالات وسيطة لمواءمة الواجهات
  const processWithOcr = useCallback((imageData: CustomImageData): Promise<string> => {
    return originalOcrProcess(imageData);
  }, [originalOcrProcess]);
  
  const processWithGemini = useCallback((imageData: CustomImageData): Promise<Partial<CustomImageData>> => {
    return originalGeminiProcess(imageData);
  }, [originalGeminiProcess]);
  
  // استيراد قاعدة البيانات
  const { 
    loadUserImages: fetchUserImages, 
    saveImageToDatabase, 
    handleSubmitToApi: submitToApi, 
    deleteImageFromDatabase, 
    runCleanupNow 
  } = useImageDatabase(updateImage);
  
  // استيراد معالجة الملفات وتمرير دالة createSafeObjectURL
  const fileProcessingResult = useFileProcessing({
    images,
    addImage,
    updateImage,
    processWithOcr: processFileWithOcr,
    processWithGemini: processFileWithGemini,
    saveProcessedImage: saveImageToDatabase,
    user,
    createSafeObjectURL: async (file: File) => {
      return await createSafeObjectURL(file);
    },
    // الدوال الاختيارية الأخرى
    checkDuplicateImage: undefined,
    markImageAsProcessed: undefined
  });
  
  // استيراد كاشف التكرار (معطل)
  const { isDuplicateImage, markImageAsProcessed } = useDuplicateDetection({ enabled: false });
  
  // استخراج متغيرات معالجة الملفات
  const { 
    isProcessing, 
    processingProgress, 
    handleFileChange: fileUploadHandler, 
    activeUploads, 
    queueLength,
  } = fileProcessingResult;

  // تصدير واجهة الخدمة
  return {
    // البيانات
    images,
    hiddenImageIds,
    // الحالة
    isProcessing,
    processingProgress,
    isSubmitting,
    activeUploads,
    queueLength,
    isLoadingUserImages,
    // الدوال
    handleFileChange: (files: FileList | File[]) => {
      fileUploadHandler(files);
    },
    handleTextChange,
    handleDelete: async (id: string) => {
      try {
        return deleteImage(id, false);
      } catch (error) {
        console.error("Error deleting image:", error);
        return false;
      }
    },
    handleSubmitToApi,
    saveImageToDatabase,
    formatDate,
    hideImage,
    unhideImage,
    unhideAllImages,
    getHiddenImageIds,
    clearSessionImages,
    loadUserImages: (callback?: (images: ImageData[]) => void) => {
      if (user) {
        fetchUserImages(user.id, (loadedImages) => {
          // تصفية الصور المخفية قبل تمريرها
          const visibleImages = loadedImages.filter(img => !hiddenImageIds.includes(img.id));
          
          if (callback) {
            callback(visibleImages);
          } else {
            setAllImages(visibleImages);
          }
          
          setIsLoadingUserImages(false);
        });
      }
    },
    clearOldApiKey: () => {
      const oldApiKey = "AIzaSyCwxG0KOfzG0HTHj7qbwjyNGtmPLhBAno8";
      const storedApiKey = localStorage.getItem("geminiApiKey");
      
      if (storedApiKey === oldApiKey) {
        localStorage.removeItem("geminiApiKey");
        const newApiKey = "AIzaSyC4d53RxIXV4WIXWcNAN1X-9WPZbS4z7Q0";
        localStorage.setItem("geminiApiKey", newApiKey);
        
        toast({
          title: "تم تحديث مفتاح API",
          description: "تم تحديث مفتاح Gemini API بنجاح",
        });
        
        return true;
      }
      
      return false;
    },
    checkDuplicateImage: () => Promise.resolve(false) // تعطيل فحص التكرار
  };
};
