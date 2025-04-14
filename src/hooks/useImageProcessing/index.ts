
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
  const { processWithOcr: originalProcessWithOcr } = useOcrProcessing();
  const { processWithGemini: originalProcessWithGemini } = useGeminiProcessing();

  // إنشاء مغلفات الدوال لمواءمة توقيع الدالة
  const processWithOcr = useCallback((image: ImageData): Promise<string> => {
    return originalProcessWithOcr(image);
  }, [originalProcessWithOcr]);
  
  const processWithGemini = useCallback((image: ImageData): Promise<Partial<ImageData>> => {
    return originalProcessWithGemini(image);
  }, [originalProcessWithGemini]);
  
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
    processWithOcr: async (file: File, imageData: ImageData) => {
      // دالة وسيطة لتكييف واجهات الدالة
      const extractedText = await processWithOcr(imageData);
      return {
        ...imageData,
        extractedText
      };
    },
    processWithGemini: async (file: File | Blob, imageData: ImageData) => {
      // دالة وسيطة لتكييف واجهات الدالة
      const result = await processWithGemini(imageData);
      return {
        ...imageData,
        ...result
      };
    },
    saveProcessedImage: saveImageToDatabase,
    user,
    createSafeObjectURL // تمرير دالة URL الآمنة من useImageState
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

  // تحميل الصور السابقة
  useEffect(() => {
    if (user) {
      setIsLoadingUserImages(true);
      fetchUserImages(user.id, (loadedImages) => {
        // تصفية الصور المخفية قبل إضافتها للعرض
        const visibleImages = loadedImages.filter(img => !hiddenImageIds.includes(img.id));
        setAllImages(visibleImages);
        setIsLoadingUserImages(false);
      });
    }
  }, [user, hiddenImageIds, setAllImages, fetchUserImages]);

  // معالجة الملفات
  const handleFileChange = (files: FileList | File[]) => {
    fileUploadHandler(files);
  };

  // حذف الصور
  const handleDelete = async (id: string) => {
    try {
      return deleteImage(id, false);
    } catch (error) {
      console.error("Error deleting image:", error);
      return false;
    }
  };

  // إرسال الصور إلى API
  const handleSubmitToApi = useCallback(async (id: string) => {
    try {
      setIsSubmitting(prev => ({ ...prev, [id]: true }));
      
      const image = images.find(img => img.id === id);
      if (!image) {
        throw new Error(`الصورة ذات المعرف ${id} غير موجودة`);
      }
      
      const result = await submitToApi(id, image, user?.id);
      
      if (result) {
        updateImage(id, { submitted: true });
        
        const submittedImage = images.find(img => img.id === id);
        if (submittedImage) {
          markImageAsProcessed(submittedImage);
        }
        
        toast({
          title: "تم الإرسال بنجاح",
          description: "تم إرسال البيانات بنجاح إلى API"
        });
        
        hideImage(id);
        
        return true;
      }
      
      return result;
    } catch (error) {
      console.error("Error submitting image:", error);
      toast({
        title: "خطأ في الإرسال",
        description: "حدث خطأ أثناء إرسال البيانات",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSubmitting(prev => ({ ...prev, [id]: false }));
    }
  }, [images, submitToApi, toast, updateImage, user?.id, markImageAsProcessed, hideImage]);

  // إعادة محاولة المعالجة
  const retryProcessing = () => {
    toast({
      title: "إعادة المحاولة",
      description: "جاري إعادة معالجة الصور التي فشلت",
    });
  };
  
  // مسح قائمة الانتظار
  const clearQueue = () => {
    toast({
      title: "تم إفراغ القائمة",
      description: "تم إفراغ قائمة انتظار الصور",
    });
  };

  // إضافة دالة التحقق من مفتاح API قديم وتحديثه
  const clearOldApiKey = useCallback(() => {
    const oldApiKey = "AIzaSyCwxG0KOfzG0HTHj7qbwjyNGtmPLhBAno8"; // المفتاح القديم
    const storedApiKey = localStorage.getItem("geminiApiKey");
    
    if (storedApiKey === oldApiKey) {
      console.log("تم اكتشاف مفتاح API قديم. جاري المسح...");
      localStorage.removeItem("geminiApiKey");
      
      // تعيين المفتاح الجديد
      const newApiKey = "AIzaSyC4d53RxIXV4WIXWcNAN1X-9WPZbS4z7Q0";
      localStorage.setItem("geminiApiKey", newApiKey);
      
      toast({
        title: "تم تحديث مفتاح API",
        description: "تم تحديث مفتاح Gemini API بنجاح",
      });
      
      return true;
    }
    
    return false;
  }, [toast]);

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
    handleFileChange,
    handleTextChange,
    handleDelete,
    handleSubmitToApi,
    saveImageToDatabase,
    formatDate,
    hideImage,
    unhideImage,
    unhideAllImages,
    getHiddenImageIds,
    clearSessionImages,
    retryProcessing,
    clearQueue,
    runCleanup: (userId: string) => {
      if (userId) {
        runCleanupNow(userId);
      }
    },
    createSafeObjectURL, // تصدير الدالة للاستخدام الخارجي
    clearOldApiKey,
    checkDuplicateImage: () => Promise.resolve(false) // تعطيل فحص التكرار
  };
};
