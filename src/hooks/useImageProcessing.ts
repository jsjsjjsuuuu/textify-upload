import { useState, useEffect, useCallback, useMemo } from "react";
import { ImageData } from "@/types/ImageData";
import { useImageProcessingCore } from './useImageProcessingCore';
import { useGeminiProcessing } from './useGeminiProcessing';
import { useImageQueue } from './useImageQueue';

export const useImageProcessing = () => {
  const { 
    images,
    sessionImages,
    isProcessing,
    processingProgress,
    isSubmitting,
    isLoadingUserImages,
    bookmarkletStats,
    handleFileChange: handleFileChangeCore,
    handleTextChange,
    handleDelete,
    handleSubmitToApi,
    saveImageToDatabase,
    saveProcessedImage,
    loadUserImages: coreLoadUserImages,
    clearSessionImages,
    validateRequiredFields,
    runCleanupNow,
    retryProcessing,
    pauseProcessing,
    clearQueue,
    activeUploads,
    queueLength
  } = useImageProcessingCore();

  // استخدام معالجة Gemini
  const { 
    useGemini, 
    processWithGemini, 
    // البدء دائمًا بـ useGemini = true
    setUseGemini: setUseGeminiOption,
    resetApiKeys 
  } = useGeminiProcessing();

  // استخدام نظام قائمة الانتظار
  const {
    addToQueue,
    isProcessing: isQueueProcessing,
    queueLength: queueSize,
    activeUploads: activeQueueUploads,
    manuallyTriggerProcessingQueue,
    pauseProcessing: pauseQueueProcessing,
    clearQueue: clearQueueProcessing,
    getProcessingState
  } = useImageQueue();

  // تعديل معالجة الملفات لتكون دائمًا مع Gemini
  const handleFileChange = useCallback(async (files: File[] | FileList) => {
    console.log(`استلام ${files.length} ملفات للمعالجة...`);
    const fileArray = Array.from(files);
    
    // معالجة الملفات باستخدام Gemini مباشرة
    const result = await handleFileChangeCore(fileArray);
    return result;
  }, [handleFileChangeCore]);

  // وظيفة إعادة المعالجة
  const reprocessImage = useCallback(async (imageId: string) => {
    // العثور على الصورة بناءً على المعرف
    const image = images.find(img => img.id === imageId);
    if (!image) {
      console.error(`لم يتم العثور على الصورة: ${imageId}`);
      return false;
    }
    
    // إنشاء عملية معالجة جديدة
    const processFunc = async () => {
      try {
        // استخدام Gemini لمعالجة الصورة
        const processedData = await processWithGemini(image.file, image);
        if (processedData) {
          // حفظ النتائج المعالجة
          await saveProcessedImage({
            ...image,
            ...processedData,
            status: "completed",
            retryCount: (image.retryCount || 0) + 1
          });
          return;
        }
      } catch (error) {
        console.error(`فشل إعادة معالجة الصورة ${imageId}:`, error);
      }
    };

    // إضافة إلى قائمة المعالجة
    addToQueue(imageId, image, processFunc);
    return true;
  }, [images, processWithGemini, saveProcessedImage, addToQueue]);

  // تصحيح استدعاء وظيفة تحميل الصور بدون معاملات
  const loadUserImages = useCallback(() => {
    coreLoadUserImages();
  }, [coreLoadUserImages]);

  // إرجاع واجهة API
  return useMemo(() => ({
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
    handleSubmitToApi,
    loadUserImages,
    clearSessionImages,
    saveImageToDatabase,
    validateRequiredFields,
    runCleanupNow,
    reprocessImage,
    retryProcessing,
    pauseProcessing,
    clearQueue,
    // دائمًا استخدام Gemini
    useGemini: true,
    // تعيين استخدام Gemini دائمًا كـ true
    setUseGemini: () => setUseGeminiOption(true),
    resetApiKeys,
    activeUploads,
    queueLength
  }), [
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
    handleSubmitToApi,
    loadUserImages,
    clearSessionImages,
    saveImageToDatabase,
    validateRequiredFields,
    runCleanupNow,
    reprocessImage,
    retryProcessing,
    pauseProcessing,
    clearQueue,
    useGemini,
    setUseGeminiOption,
    resetApiKeys,
    activeUploads,
    queueLength
  ]);
};
