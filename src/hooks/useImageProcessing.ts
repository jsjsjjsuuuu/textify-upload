import { useCallback, useMemo } from "react";
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
    loadUserImages,
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
    enqueueForProcessing,
    reprocessImage: reprocessImageInQueue
  } = useImageQueue({
    processWithGemini,
    saveProcessedImage
  });

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
    return await reprocessImageInQueue(imageId);
  }, [reprocessImageInQueue]);

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
