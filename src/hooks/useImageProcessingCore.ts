
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { ImageData, CustomImageData } from "@/types/ImageData";
import { useImageState } from "@/hooks/imageState";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useAuth } from "@/contexts/AuthContext";
import { useImageStats } from "@/hooks/useImageStats";
import { useImageDatabase } from "@/hooks/useImageDatabase";
import { useSavedImageProcessing } from "@/hooks/useSavedImageProcessing";
import { useDuplicateDetection } from "@/hooks/useDuplicateDetection";
import { useGeminiProcessing } from "@/hooks/useGeminiProcessing";
import { useOcrProcessing } from "@/hooks/useOcrProcessing";
import { useApiKeyManagement } from "@/hooks/processingCore/useApiKeyManagement";
import { useFormValidation } from "@/hooks/processingCore/useFormValidation";
import { useImageSubmission } from "@/hooks/processingCore/useImageSubmission";
import { useImageDeletion } from "@/hooks/processingCore/useImageDeletion";
import { useUserImages } from "@/hooks/processingCore/useUserImages";
import { UseImageDatabaseConfig } from "@/hooks/useImageDatabase/types";

export const useImageProcessingCore = () => {
  const { user } = useAuth();
  
  // استخدام useImageState المحدث مع الخصائص الإضافية
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
  const { processFileWithGemini } = useGeminiProcessing();
  const { processFileWithOcr } = useOcrProcessing();
  
  // إنشاء كائن التكوين للـ useImageDatabase
  const updateImageConfig: UseImageDatabaseConfig = {
    updateImage: updateImage
  };
  
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
  } = useImageDatabase(updateImageConfig);

  // استخدام هوك التحقق من صحة النماذج
  const { validateRequiredFields } = useFormValidation();
  
  // استخدام هوك إرسال الصور
  const { isSubmitting, handleSubmitToApi } = useImageSubmission({
    images,
    updateImage,
    hideImage,
    submitToApi,
    validateRequiredFields,
    markImageAsProcessed: duplicateDetectionTools.markImageAsProcessed
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
  }, [user, hiddenImageIds, loadUserImages, setAllImages, cleanupOldRecords]);

  // تعديل دالة جلب الصور ليكون لها نفس التوقيع المتوقع
  const modifiedLoadUserImages = useCallback((userId: string, callback?: (images: ImageData[]) => void): Promise<void> => {
    return new Promise<void>((resolve) => {
      loadUserImages(userId, (images: ImageData[]) => {
        if (callback) callback(images);
        resolve();
      });
    });
  }, [loadUserImages]);

  // تصدير الوظائف المتاحة
  return {
    images,
    sessionImages,
    isProcessing: false,
    processingProgress,
    isSubmitting,
    isLoadingUserImages: isLoadingImages,
    bookmarkletStats,
    hiddenImageIds,
    handleTextChange,
    handleDelete,
    handleSubmitToApi: (id: string) => handleSubmitToApi(id, user?.id),
    saveImageToDatabase,
    saveProcessedImage,
    hideImage,
    loadUserImages: modifiedLoadUserImages,
    clearSessionImages,
    removeDuplicates,
    validateRequiredFields,
    runCleanupNow,
    activeUploads: 0,
    queueLength: 0,
    unhideImage,
    unhideAllImages,
    clearOldApiKey,
    handlePermanentDelete,
    isDuplicateImage: duplicateDetectionTools.isDuplicateImage,
    checkDuplicateImage: duplicateDetectionTools.isDuplicateImage,
    markImageAsProcessed: duplicateDetectionTools.markImageAsProcessed,
    processWithGemini: processFileWithGemini,
    processWithOcr: processFileWithOcr
  };
};
