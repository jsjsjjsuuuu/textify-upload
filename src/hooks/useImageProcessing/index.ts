
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { ImageData } from "@/types/ImageData";
import { useImageState } from "@/hooks/imageState";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useAuth } from "@/contexts/AuthContext";
import { useImageStats } from "@/hooks/useImageStats";
import { useImageDatabase } from "@/hooks/useImageDatabase";
import { useGeminiProcessing } from "@/hooks/useGeminiProcessing";
import { useOcrProcessing } from "@/hooks/useOcrProcessing";
import { createSafeObjectURL } from "@/utils/createSafeObjectUrl";

export const useImageProcessing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isLoadingUserImages, setIsLoadingUserImages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
  
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
    hideImage 
  } = useImageState();
  
  const { processWithOcr } = useOcrProcessing();
  const { processWithGemini } = useGeminiProcessing();
  
  const fileUploadResult = useFileUpload({
    images,
    addImage,
    updateImage,
    processWithOcr: processWithOcr,
    processWithGemini: processWithGemini,
    createSafeObjectURL
  });

  // دالة لإعادة تحميل صورة محددة
  const retryProcessing = useCallback((imageId: string) => {
    console.log("محاولة إعادة معالجة الصورة:", imageId);
    const image = images.find(img => img.id === imageId);
    if (image && image.file) {
      // إعادة معالجة الصورة
      updateImage(imageId, { status: 'processing' });
      processWithOcr(image.file, image)
        .then(processedImage => {
          updateImage(imageId, { 
            ...processedImage,
            status: 'completed'
          });
        })
        .catch(error => {
          console.error("خطأ في إعادة معالجة الصورة:", error);
          updateImage(imageId, { status: 'error' });
        });
    } else {
      console.error("تعذر العثور على الصورة أو ملف الصورة مفقود:", imageId);
    }
  }, [images, updateImage, processWithOcr]);

  return {
    images,
    hiddenImageIds,
    isProcessing: fileUploadResult.isProcessing,
    processingProgress: fileUploadResult.processingProgress,
    isSubmitting,
    activeUploads: fileUploadResult.activeUploads,
    queueLength: fileUploadResult.queueLength,
    isLoadingUserImages,
    handleFileChange: fileUploadResult.handleFileChange,
    handleTextChange,
    handleDelete: deleteImage,
    handleSubmitToApi: () => {},
    saveImageToDatabase: () => {},
    formatDate: (date: Date) => date.toLocaleDateString(),
    hideImage,
    unhideImage,
    unhideAllImages,
    getHiddenImageIds: () => [],
    clearSessionImages,
    retryProcessing,
    clearQueue: () => {},
    runCleanup: () => {},
    loadUserImages: () => {},
    setImages: setAllImages,
    clearOldApiKey: () => false,
    checkDuplicateImage: () => Promise.resolve(false)
  };
};

export default useImageProcessing;
