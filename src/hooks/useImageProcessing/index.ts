
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
    setAllImages
  } = useImageState();
  
  // استيراد معالجات OCR و Gemini
  const { processWithOcr } = useOcrProcessing();
  const { processWithGemini } = useGeminiProcessing();
  
  // استيراد قاعدة البيانات
  const { 
    loadUserImages: fetchUserImages, 
    saveImageToDatabase, 
    handleSubmitToApi: submitToApi, 
    deleteImageFromDatabase, 
    runCleanupNow 
  } = useImageDatabase(updateImage);
  
  // استيراد معالجة الملفات
  const fileProcessingResult = useFileProcessing({
    images,
    addImage,
    updateImage,
    processWithOcr,
    processWithGemini,
    saveProcessedImage: saveImageToDatabase,
    user
    // إزالة الخاصية المكررة images
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
    createSafeObjectURL
  } = fileProcessingResult;

  // تحميل الصور السابقة
  useEffect(() => {
    if (user) {
      setIsLoadingUserImages(true);
      fetchUserImages(user.id, (loadedImages) => {
        // تصفية الصور المخفية قبل إضافتها للعرض
        const visibleImages = loadedImages.filter(img => !hiddenImageIds.includes(img.id));
        
        // معالجة الصور للحصول على روابط آمنة
        const safeImages = visibleImages.map(img => {
          if (img.file && (!img.previewUrl || img.previewUrl.startsWith('blob:'))) {
            return { ...img, previewUrl: createSafeObjectURL(img.file) };
          }
          return img;
        });
        
        setAllImages(safeImages);
        setIsLoadingUserImages(false);
      });
    }
  }, [user, hiddenImageIds, setAllImages, createSafeObjectURL, fetchUserImages]);

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
    checkDuplicateImage: () => Promise.resolve(false) // تعطيل فحص التكرار
  };
};
