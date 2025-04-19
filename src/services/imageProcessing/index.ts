
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
import { ImageData, CustomImageData } from "@/types/ImageData";
import { formatDate } from "@/utils/dateFormatter";
import { createSafeObjectURL } from "@/utils/createSafeObjectUrl";

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
    setAllImages
  } = useImageState();
  
  // استيراد معالجات OCR و Gemini
  const { processWithOcr } = useOcrProcessing();
  const { processFileWithGemini } = useGeminiProcessing();
  
  // استيراد قاعدة البيانات
  const { 
    loadUserImages: fetchUserImages, 
    saveImageToDatabase, 
    handleSubmitToApi: submitToApi, 
    deleteImageFromDatabase, 
    runCleanupNow 
  } = useImageDatabase(updateImage);
  
  // استخدام هوك معالجة الملفات مع النسخة المحسّنة من createSafeObjectURL
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
    processWithOcr,
    processWithGemini: processFileWithGemini,
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

  // دالة إعادة معالجة الصور
  const retryProcessing = useCallback(async (imageId: string) => {
    console.log("جاري محاولة إعادة معالجة الصورة:", imageId);
    const image = images.find(img => img.id === imageId);
    
    if (!image) {
      console.error("لم يتم العثور على الصورة:", imageId);
      return;
    }
    
    try {
      // تحديث حالة الصورة
      updateImage(imageId, { status: 'processing' });
      
      if (image.file) {
        // إذا كان الملف متاحاً، أعد إنشاء عنوان URL للمعاينة
        const previewUrl = await createSafeObjectURL(image.file);
        updateImage(imageId, { previewUrl });
        
        // إعادة معالجة الصورة بـ OCR
        const processedWithOcr = await processWithOcr(image.file, image as CustomImageData);
        
        // تحديث بيانات الصورة
        updateImage(imageId, { 
          ...processedWithOcr, 
          status: 'completed' 
        });
        
        toast({
          title: "تمت إعادة المعالجة",
          description: "تمت إعادة معالجة الصورة بنجاح"
        });
      } else {
        // إذا كان الملف غير متاح، حاول تحديث المعاينة فقط
        console.log("ملف الصورة غير متاح، محاولة تحديث المعاينة فقط");
        
        // إعادة تعيين previewUrl لإجبار الصورة على إعادة التحميل
        if (image.previewUrl) {
          const timestamp = Date.now();
          const refreshedUrl = image.previewUrl.includes('?') 
            ? `${image.previewUrl.split('?')[0]}?v=${timestamp}` 
            : `${image.previewUrl}?v=${timestamp}`;
          
          updateImage(imageId, { previewUrl: refreshedUrl, status: 'completed' });
        }
        
        toast({
          title: "تم التحديث",
          description: "تم تحديث عرض الصورة"
        });
      }
    } catch (error) {
      console.error("خطأ في إعادة معالجة الصورة:", error);
      updateImage(imageId, { status: 'error' });
      
      toast({
        title: "خطأ في المعالجة",
        description: "حدث خطأ أثناء إعادة معالجة الصورة",
        variant: "destructive"
      });
    }
  }, [images, updateImage, processWithOcr, toast]);

  // حذف الصور
  const handleDelete = async (id: string) => {
    try {
      console.log("طلب حذف الصورة:", id);
      return deleteImage(id, false);
    } catch (error) {
      console.error("خطأ في حذف الصورة:", error);
      return false;
    }
  };

  // إضافة دالة الحذف النهائي من قاعدة البيانات
  const handlePermanentDelete = async (id: string) => {
    try {
      console.log("طلب الحذف النهائي للصورة:", id);
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
      console.log("طلب إرسال الصورة:", id);
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
      console.error("خطأ في إرسال الصورة:", error);
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

  // دالة التحقق من مفتاح API قديم وتحديثه
  const clearOldApiKey = useCallback(() => {
    const oldApiKey = "AIzaSyCwxG0KOfzG0HTHj7qbwjyNGtmPLhBAno8";
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
    retryProcessing,
    loadUserImages,
    runCleanup: runCleanupNow,
    clearOldApiKey,
    checkDuplicateImage: () => Promise.resolve(false)
  };
};
