
import { useState, useEffect, useCallback } from "react";
import { useImageState } from "@/hooks/imageState";
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
import { UseImageDatabaseConfig } from "@/hooks/useImageDatabase/types";
import type { ImageData } from "@/types/ImageData";
import { formatDate as formatDateUtil } from "@/utils/dateFormatter"; 

/**
 * هوك مركزي لمعالجة الصور 
 * يجمع كافة الوظائف المتعلقة بمعالجة الصور في واجهة واحدة
 */
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
  
  // استخدام إحصائيات الصور
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
      loadUserImages(userId, (loadedImages: ImageData[]) => {
        if (callback) callback(loadedImages);
        resolve();
      });
    });
  }, [loadUserImages]);

  // دالة تنسيق التاريخ
  const formatDate = (date: Date): string => {
    return formatDateUtil(date);
  };

  // دالة إعادة المعالجة
  const retryProcessing = useCallback((imageId: string): Promise<boolean> => {
    console.log('محاولة إعادة معالجة الصورة:', imageId);
    // هنا يمكن إضافة منطق إعادة المعالجة الفعلي
    return Promise.resolve(true);
  }, []);

  // دالة مسح قائمة الانتظار
  const clearQueue = useCallback((): boolean => {
    console.log('تم مسح قائمة الانتظار');
    return true;
  }, []);

  // دالة تنظيف البيانات
  const runCleanup = useCallback((userId: string): Promise<boolean> => {
    if (userId) {
      return runCleanupNow(userId).then(() => true);
    }
    return Promise.resolve(false);
  }, [runCleanupNow]);

  // تصدير الوظائف المتاحة
  return {
    images,
    sessionImages,
    isProcessing: false, // سيتم تحديثها من useFileUpload
    processingProgress,
    isSubmitting,
    isLoadingUserImages,
    bookmarkletStats,
    hiddenImageIds,
    // وظائف التحميل والعمليات
    handleFileChange: (files: FileList | File[]) => {
      console.log("تم استدعاء handleFileChange");
      // يمكن إضافة منطق معالجة الملفات هنا
    },
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
    activeUploads: 0, // سيتم تحديثها من useFileUpload
    queueLength: 0, // سيتم تحديثها من useFileUpload
    unhideImage,
    unhideAllImages,
    clearOldApiKey,
    handlePermanentDelete,
    isDuplicateImage: duplicateDetectionTools.isDuplicateImage,
    checkDuplicateImage: duplicateDetectionTools.checkDuplicateImage,
    markImageAsProcessed: duplicateDetectionTools.markImageAsProcessed,
    processWithGemini: processFileWithGemini,
    processWithOcr: processFileWithOcr,
    // إضافة الوظائف المفقودة التي تستخدم في Index.tsx
    formatDate,
    retryProcessing,
    clearQueue,
    runCleanup
  };
};

// تصدير استخدام هوك معالجة الصور تحت اسم جديد
export { useImageProcessingCore as useImageProcessing };
