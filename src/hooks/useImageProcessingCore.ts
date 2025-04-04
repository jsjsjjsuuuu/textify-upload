import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { ImageData } from "@/types/ImageData";
import { useImageState } from "@/hooks/useImageState";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useAuth } from "@/contexts/AuthContext";
import { useImageStats } from "@/hooks/useImageStats";
import { useImageDatabase } from "@/hooks/useImageDatabase";
import { useSavedImageProcessing } from "@/hooks/useSavedImageProcessing";
import { useImageStorage } from "@/hooks/useImageStorage";
import { useCleanupSystem } from "./processing/useCleanupSystem";
import { useImageHandlers } from "./processing/useImageHandlers";
import { useSubmitSystem } from "./processing/useSubmitSystem";
import { useDuplicateCheck } from "./processing/useDuplicateCheck";

export const useImageProcessingCore = () => {
  const [processingProgress, setProcessingProgress] = useState<{ total: number; current: number; errors: number; }>({
    total: 0,
    current: 0,
    errors: 0
  });
  
  const { toast } = useToast();
  const { user } = useAuth();
  
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
    removeDuplicates
  } = useImageState();
  
  const {
    bookmarkletStats,
    setBookmarkletStats,
    isImageProcessed,
    markImageAsProcessed,
    clearProcessedImagesCache
  } = useImageStats();
  
  const { saveProcessedImage } = useSavedImageProcessing(updateImage, setAllImages);
  
  const {
    isUploading,
    uploadImageToStorage,
    deleteImageFromStorage,
    prepareNewImage,
    ensureStorageBucketExists
  } = useImageStorage();
  
  const { 
    isLoadingUserImages,
    loadUserImages: loadUserImagesFromDb,
    saveImageToDatabase,
    handleSubmitToApi: dbSubmitToApi,
    deleteImageFromDatabase,
    cleanupOldRecords,
    runCleanupNow: runDbCleanupNow
  } = useImageDatabase(updateImage);

  // استخدام الأنظمة المساعدة
  const { isDuplicateImage } = useDuplicateCheck(isImageProcessed);
  
  const { validateRequiredFields, handleDelete } = useImageHandlers(
    images, 
    updateImage, 
    deleteImage, 
    deleteImageFromStorage, 
    deleteImageFromDatabase
  );
  
  const { runCleanupNow, isCleanupRunning } = useCleanupSystem(runDbCleanupNow, user);
  
  const { isSubmitting, handleSubmitToApi } = useSubmitSystem(
    images,
    updateImage,
    saveImageToDatabase,
    validateRequiredFields
  );

  // إنشاء كائن useFileUpload في بداية الملف
  const fileUploadData = useFileUpload({
    images,
    addImage,
    updateImage,
    setProcessingProgress,
    saveProcessedImage,
    isDuplicateImage,
    removeDuplicates
  });
  
  // إضافة وظيفة إعادة تشغيل عملية المعالجة عندما تتجمد العملية
  const retryProcessing = useCallback(() => {
    if (fileUploadData && fileUploadData.manuallyTriggerProcessingQueue) {
      console.log("إعادة تشغيل عملية معالجة الصور...");
      fileUploadData.manuallyTriggerProcessingQueue();
      toast({
        title: "تم إعادة التشغيل",
        description: "تم إعادة تشغيل عملية معالجة الصور بنجاح",
      });
      return true;
    }
    return false;
  }, [toast, fileUploadData]);

  // وظيفة مسح ذاكرة التخزين المؤقت للصور المعالجة
  const clearImageCache = useCallback(() => {
    clearProcessedImagesCache();
    if (fileUploadData && fileUploadData.clearProcessedHashesCache) {
      fileUploadData.clearProcessedHashesCache();
    }
    toast({
      title: "تم المسح",
      description: "تم مسح ذاكرة التخزين المؤقت للصور المعالجة",
    });
  }, [clearProcessedImagesCache, toast, fileUploadData]);
  
  // وظيفة إيقاف عملية المعالجة مؤقتًا
  const pauseProcessing = useCallback(() => {
    if (fileUploadData && fileUploadData.pauseProcessing) {
      console.log("إيقاف عملية معالجة الصور مؤقتًا...");
      fileUploadData.pauseProcessing();
      toast({
        title: "تم الإيقاف مؤقتًا",
        description: "تم إيقاف عملية معالجة الصور مؤقتًا، يمكنك إعادة تشغيلها لاحقًا",
      });
      return true;
    }
    return false;
  }, [toast, fileUploadData]);

  const { 
    isProcessing, 
    handleFileChange,
    activeUploads,
    queueLength,
    useGemini,
    pauseProcessing: filePauseProcessing,
    clearQueue,
  } = fileUploadData;

  // تعديل وظيفة تحميل صور المستخدم ليتم استدعاؤها بدون معاملات
  const loadUserImages = useCallback(() => {
    if (user) {
      console.log("تحميل صور المستخدم...");
      // استعمال المعاملات المطلوبة داخليًا
      loadUserImagesFromDb(user.id, setAllImages);
      
      // تشغيل التنظيف مرة واحدة فقط عند التحميل الأولي
      if (!isCleanupRunning()) {
        console.log("تشغيل التنظيف التلقائي عند تحميل الصور...");
        runCleanupNow();
      }
    }
  }, [user, loadUserImagesFromDb, setAllImages, runCleanupNow, isCleanupRunning]);

  // جلب صور المستخدم من قاعدة البيانات عند تسجيل الدخول
  useEffect(() => {
    // التأكد من وجود مخزن الصور
    if (user) {
      ensureStorageBucketExists();
    }
  }, [user, ensureStorageBucketExists]);
  
  // تحميل صور المستخدم عند تسجيل الدخول
  useEffect(() => {
    if (user) {
      console.log("تم تسجيل الدخول، جاري جلب صور المستخدم:", user.id);
      loadUserImages();
    }
  }, [user, loadUserImages]);

  return {
    images,
    sessionImages,
    isProcessing,
    processingProgress,
    isSubmitting,
    isLoadingUserImages,
    bookmarkletStats,
    handleFileChange,
    handleTextChange,
    handleDelete,
    handleSubmitToApi: (id: string) => handleSubmitToApi(id, user),
    saveImageToDatabase,
    saveProcessedImage,
    useGemini,
    loadUserImages,
    clearSessionImages,
    removeDuplicates,
    validateRequiredFields,
    runCleanupNow,
    isDuplicateImage,
    clearImageCache,
    retryProcessing,
    pauseProcessing,
    clearQueue,
    activeUploads,
    queueLength
  };
};
