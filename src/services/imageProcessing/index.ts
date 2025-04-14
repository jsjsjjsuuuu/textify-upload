
/**
 * خدمة معالجة الصور
 * خدمة مركزية للتعامل مع معالجة الصور وتخزينها وإدارتها
 */
import { useState, useEffect, useCallback } from "react";
import { useImageState } from "@/hooks/imageState";
import { useAuth } from "@/contexts/AuthContext";
import { useImageStats } from "@/hooks/useImageStats";
import { useImageDatabase } from "@/hooks/useImageDatabase";
import { useGeminiProcessing } from "@/hooks/useGeminiProcessing";
import { useOcrProcessing } from "@/hooks/useOcrProcessing";
import { useFileProcessing } from "./useFileProcessing";
import { useToast } from "@/hooks/use-toast";
import { ImageData } from "@/types/ImageData";
import { formatDate } from "@/utils/dateFormatter";

export const useImageProcessing = () => {
  // المكونات الأساسية
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
    createSafeObjectURL
  } = useImageState();
  
  // استيراد معالجات OCR و Gemini ومواءمتها مع الواجهات المطلوبة
  const { processWithOcr: originalProcessWithOcr } = useOcrProcessing();
  const { processWithGemini: originalProcessWithGemini } = useGeminiProcessing();
  
  // إنشاء مغلفات الدوال لمواءمة توقيع الدالة
  const processWithOcr = useCallback((image: ImageData): Promise<string> => {
    // تمرير الصورة فقط لواجهة الدالة المطلوبة
    return originalProcessWithOcr(image);
  }, [originalProcessWithOcr]);
  
  const processWithGemini = useCallback((image: ImageData): Promise<Partial<ImageData>> => {
    // تمرير الصورة فقط لواجهة الدالة المطلوبة
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
  
  // استخدام هوك معالجة الملفات
  const {
    isProcessing,
    processingProgress,
    activeUploads,
    queueLength,
    handleFileChange: fileUploadHandler
  } = useFileProcessing({
    images,
    addImage,
    updateImage,
    processWithOcr: async (file: File, imageData: ImageData) => {
      // دالة وسيطة لتكييف واجهات الدالة
      // استخدام دالة processWithOcr لمعالجة الصورة
      const extractedText = await processWithOcr(imageData);
      return {
        ...imageData,
        extractedText
      };
    },
    processWithGemini: async (file: File | Blob, imageData: ImageData) => {
      // دالة وسيطة لتكييف واجهات الدالة
      // استخدام دالة processWithGemini لمعالجة الصورة
      const result = await processWithGemini(imageData);
      return {
        ...imageData,
        ...result
      };
    },
    saveProcessedImage: saveImageToDatabase,
    user,
    createSafeObjectURL
  });

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

  // إضافة دالة الحذف النهائي من قاعدة البيانات
  const handlePermanentDelete = async (id: string) => {
    try {
      if (user) {
        // الحذف من قاعدة البيانات
        await deleteImageFromDatabase(id);
      }
      // ثم الحذف من العرض المحلي مع الإشارة إلى أنه تم حذفه من قاعدة البيانات
      return deleteImage(id, true);
    } catch (error) {
      console.error("خطأ في الحذف النهائي للصورة:", error);
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء محاولة حذف الصورة نهائيًا",
        variant: "destructive"
      });
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
  }, [images, submitToApi, toast, updateImage, user?.id, hideImage]);

  // إضافة وظيفة تحميل الصور
  const loadUserImages = useCallback((callback?: (images: ImageData[]) => void) => {
    if (user) {
      setIsLoadingUserImages(true);
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
  }, [user, fetchUserImages, hiddenImageIds, setAllImages]);

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
    // الوظائف
    handleFileChange,
    handleTextChange,
    handleDelete,
    handlePermanentDelete,
    handleSubmitToApi,
    saveImageToDatabase,
    formatDate,
    hideImage,
    unhideImage,
    unhideAllImages,
    getHiddenImageIds,
    clearSessionImages,
    loadUserImages,
    runCleanup: (userId: string) => {
      if (userId) {
        runCleanupNow(userId);
      }
    },
    clearOldApiKey,
    checkDuplicateImage: () => Promise.resolve(false) // وظيفة وهمية لتعطيل فحص التكرار
  };
};
