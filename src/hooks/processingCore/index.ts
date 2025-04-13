
import { useState, useEffect, useCallback } from "react";
import { useImageState } from "../imageState";
import { useAuth } from "@/contexts/AuthContext";
import { useImageStats } from "@/hooks/useImageStats";
import { useImageDatabase } from "@/hooks/useImageDatabase";
import { useSavedImageProcessing } from "@/hooks/useSavedImageProcessing";
import { useDuplicateDetection } from "@/hooks/useDuplicateDetection";
import { useGeminiProcessing } from "@/hooks/useGeminiProcessing";
import { useOcrProcessing } from "@/hooks/useOcrProcessing";
import { useApiKeyManagement } from "./useApiKeyManagement";
import { useFormValidation } from "./useFormValidation";
import { useImageSubmission } from "./useImageSubmission";
import { useImageDeletion } from "./useImageDeletion";
import { useUserImages } from "./useUserImages";
import type { ImageData } from "@/types/ImageData"; // استيراد النوع بشكل صريح

export const useImageProcessingCore = () => {
  const { user } = useAuth();
  
  // استدعاء هوكات حالة الصورة
  const { 
    images, 
    sessionImages,
    addImage, 
    updateImage, 
    deleteImage, 
    handleTextChange,
    setAllImages,
    addDatabaseImages,
    clearSessionImages,
    removeDuplicates,
    hiddenImageIds,
    hideImage, 
    unhideImage,
    unhideAllImages
  } = useImageState();
  
  // استخدام هوك إدارة مفاتيح API
  const { clearOldApiKey } = useApiKeyManagement();
  
  // استدعام احصائيات الصور
  const {
    processingProgress,
    setProcessingProgress,
    bookmarkletStats,
    setBookmarkletStats
  } = useImageStats();
  
  // استخدام أدوات اكتشاف التكرار - تعيين enabled إلى false لتعطيل الكشف عن التكرار
  const duplicateDetectionTools = useDuplicateDetection({ enabled: false });
  
  // استخدام هوك معالجة الصور
  const { processWithGemini } = useGeminiProcessing();
  const { processWithOcr } = useOcrProcessing();
  
  // استخدام هوك حفظ الصور المعالجة
  const {
    isSubmitting: isSavingToDatabase,
    setIsSubmitting: setSavingToDatabase,
    saveProcessedImage
  } = useSavedImageProcessing(updateImage, setAllImages);
  
  // استخدام هوك قاعدة بيانات الصور
  const { 
    isLoadingUserImages,
    loadUserImages,
    saveImageToDatabase,
    handleSubmitToApi: submitToApi,
    deleteImageFromDatabase,
    cleanupOldRecords,
    runCleanupNow
  } = useImageDatabase(updateImage);

  // استخدام هوك التحقق من صحة النماذج
  const { validateRequiredFields } = useFormValidation();
  
  // استخدام هوك إرسال الصور
  const { isSubmitting, handleSubmitToApi } = useImageSubmission({
    images,
    updateImage,
    hideImage,
    submitToApi,
    validateRequiredFields,
    // تعطيل وظيفة تسجيل الصور كمعالجة
    markImageAsProcessed: () => {}
  });

  // استخدام هوك حذف الصور
  const { handleDelete, handlePermanentDelete } = useImageDeletion({
    deleteImage,
    deleteImageFromDatabase
  });

  // استخدام هوك صور المستخدم
  const { 
    isLoadingUserImages: isLoadingImages, 
    loadUserImages: loadUserImagesWrapper 
  } = useUserImages({
    loadUserImages,
    setAllImages,
    hiddenImageIds
  });
  
  // جلب صور المستخدم من قاعدة البيانات عند تسجيل الدخول
  useEffect(() => {
    if (user) {
      console.log("تم تسجيل الدخول، جاري جلب صور المستخدم:", user.id);
      loadUserImages(user.id, (loadedImages: ImageData[]) => {
        // تطبيق فلتر الصور المخفية على الصور المحملة
        const filteredImages = loadedImages.filter(img => !hiddenImageIds.includes(img.id));
        setAllImages(filteredImages);
      });
      
      // تنظيف السجلات القديمة عند بدء التطبيق
      cleanupOldRecords(user.id);
    }
  }, [user, hiddenImageIds]);

  // تصدير الوظائف المتاحة
  return {
    images,
    sessionImages,
    isProcessing: false, // سيتم تحديثها من useFileUpload
    processingProgress,
    isSubmitting,
    isLoadingUserImages: isLoadingImages,
    bookmarkletStats,
    hiddenImageIds,
    // وظائف التحميل والعمليات
    handleTextChange,
    handleDelete,
    handleSubmitToApi: (id: string) => handleSubmitToApi(id, user?.id),
    saveImageToDatabase,
    saveProcessedImage,
    hideImage,
    loadUserImages: (callback?: (images: ImageData[]) => void) => {
      if (user) {
        loadUserImagesWrapper(user.id, callback);
      }
    },
    clearSessionImages,
    removeDuplicates,
    validateRequiredFields,
    runCleanupNow,
    activeUploads: 0, // سيتم تحديثها من useFileUpload
    queueLength: 0, // سيتم تحديثها من useFileUpload
    unhideImage,
    unhideAllImages,
    clearOldApiKey,
    handlePermanentDelete,
    // تعديل الدوال لتعطيل فحص التكرارات
    isDuplicateImage: () => Promise.resolve(false),
    checkDuplicateImage: () => Promise.resolve(false),
    markImageAsProcessed: () => {},
    processWithGemini,
    processWithOcr
  };
};
