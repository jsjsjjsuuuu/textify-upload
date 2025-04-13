
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/utils/dateFormatter";
import { useImageState } from "../useImageState";
import { useOcrProcessing } from "../useOcrProcessing";
import { useGeminiProcessing } from "../useGeminiProcessing";
import { useImageDatabase } from "../useImageDatabase";
import { useDuplicateDetection } from "../useDuplicateDetection";
import { useFileProcessing } from "./useFileProcessing";
import { useApiKeyManagement } from "../processingCore/useApiKeyManagement";
import { useImageDeletion } from "../processingCore/useImageDeletion";
import { useState } from "react";
import type { ImageData } from "@/types/ImageData"; // استيراد النوع بشكل صريح

export const useImageProcessing = () => {
  // إعادة تصدير دالة formatDate لاستخدامها في المكونات
  const formatDateFn = formatDate;
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});

  // توابع المعالجة الرئيسية من الهوكس الخاصة
  const { user } = useAuth();
  
  // استيراد الهوكس
  const { 
    images, 
    updateImage, 
    deleteImage, 
    addImage, 
    clearSessionImages,
    handleTextChange,
    setAllImages,
    hiddenImageIds,
    unhideImage,
    unhideAllImages,
    getHiddenImageIds,
    hideImage
  } = useImageState();
  
  // استيراد هوك إدارة مفاتيح API
  const { clearOldApiKey } = useApiKeyManagement();
  
  // استيراد هوكات معالجة الصور
  const { processWithOcr } = useOcrProcessing();
  const { processWithGemini } = useGeminiProcessing();
  
  // استيراد هوك قاعدة البيانات مع تمرير دالة updateImage
  const { 
    loadUserImages: fetchUserImages, 
    saveImageToDatabase, 
    handleSubmitToApi: submitToApi, 
    deleteImageFromDatabase,
    runCleanupNow 
  } = useImageDatabase(updateImage);
  
  // استيراد هوك حذف الصور
  const { handlePermanentDelete: permanentDelete } = useImageDeletion({ 
    deleteImage, 
    deleteImageFromDatabase 
  });
  
  // هوك كشف التكرارات - تعطيله تمامًا بتعيين enabled: false
  const { checkDuplicateImage, markImageAsProcessed } = useDuplicateDetection({ enabled: false });
  
  // استخدام هوك معالجة الملفات مع تمرير الإعدادات الصحيحة
  const { 
    isProcessing, 
    processingProgress,
    activeUploads,
    queueLength,
    handleFileChange,
    setProcessingProgress
  } = useFileProcessing({
    addImage,
    updateImage,
    processWithOcr,
    processWithGemini,
    checkDuplicateImage: () => Promise.resolve(false), // تعطيل فحص التكرار تمامًا
    markImageAsProcessed: () => {}, // دالة فارغة لا تفعل شيئًا
    user,
    images
  });
  
  // تعديل وظيفة handleSubmitToApi للتأكد من إخفاء الصورة بعد الإرسال الناجح
  const handleSubmitToApi = async (id: string) => {
    try {
      console.log("بدء عملية الإرسال للصورة:", id);
      
      // تحديث حالة التقديم باستخدام setIsSubmitting 
      setIsSubmitting(prev => ({ ...prev, [id]: true }));
      
      // البحث عن الصورة المقابلة
      const image = images.find(img => img.id === id);
      
      if (!image) {
        throw new Error(`الصورة ذات المعرف ${id} غير موجودة`);
      }
      
      // استدعاء دالة submitToApi مع تمرير المعلومات المطلوبة
      const result = await submitToApi(id, image, user?.id);
      
      // تحديث حالة الصورة إذا كان الإرسال ناجحًا
      if (result) {
        console.log("تم إرسال الصورة بنجاح:", id);
        updateImage(id, { submitted: true });
        
        // إخفاء الصورة بعد الإرسال - تحسين طريقة الاستدعاء
        console.log("إخفاء الصورة بعد الإرسال الناجح:", id);
        hideImage(id);
        console.log("تم إخفاء الصورة بنجاح:", id);
        console.log("معرفات الصور المخفية الآن:", getHiddenImageIds());
        
        return true;
      }
      
      return result;
    } catch (error) {
      console.error("خطأ في إرسال الصورة:", error);
      return false;
    } finally {
      // إعادة تعيين حالة التقديم
      setIsSubmitting(prev => ({ ...prev, [id]: false }));
    }
  };
  
  // وظيفة تحميل صور المستخدم
  const loadUserImages = (callback?: (images: ImageData[]) => void) => {
    if (user) {
      return fetchUserImages(user.id, (loadedImages: ImageData[]) => {
        // تصفية الصور المخفية قبل إضافتها للعرض
        const visibleImages = loadedImages.filter(img => !hiddenImageIds.includes(img.id));
        console.log(`تم تحميل ${loadedImages.length} صورة، و${visibleImages.length} صورة مرئية بعد تصفية ${hiddenImageIds.length} صورة مخفية`);
        if (callback) {
          callback(visibleImages);
        } else {
          setAllImages(visibleImages);
        }
      });
    }
  };

  // حذف الصورة بشكل نهائي
  const handlePermanentDelete = async (id: string) => {
    console.log("بدء عملية الحذف النهائي للصورة:", id);
    const result = await permanentDelete(id);
    if (result) {
      // إزالة الصورة من قائمة الصور المعروضة
      deleteImage(id);
      console.log("تم حذف الصورة نهائيًا:", id);
    }
    return result;
  };

  // إعادة تصدير الواجهة العامة بشكل أكثر تنظيماً
  return {
    // البيانات
    images,
    hiddenImageIds,
    
    // الحالة
    isProcessing,
    processingProgress,
    activeUploads,
    queueLength,
    isSubmitting,
    
    // الدوال
    handleFileChange,
    handleTextChange,
    handleDelete: deleteImage,
    handleSubmitToApi,
    handlePermanentDelete: permanentDelete,
    saveImageToDatabase,
    formatDate: formatDateFn,
    hideImage,
    unhideImage,
    unhideAllImages,
    getHiddenImageIds,
    clearSessionImages,
    runCleanup: (userId: string) => {
      if (userId) {
        runCleanupNow(userId);
      }
    },
    loadUserImages,
    setImages: setAllImages,
    clearOldApiKey,
    checkDuplicateImage: () => Promise.resolve(false) // دائما نعيد false لتعطيل فحص التكرار
  };
};
