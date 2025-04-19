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
  
  const { processFileWithOcr } = useOcrProcessing();
  const { processFileWithGemini } = useGeminiProcessing();
  
  const fileUploadResult = useFileUpload({
    images,
    addImage,
    updateImage,
    processWithOcr: processFileWithOcr,
    processWithGemini: processFileWithGemini,
    user
  });

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
    formatDate: () => "",
    hideImage,
    unhideImage,
    unhideAllImages,
    getHiddenImageIds: () => [],
    clearSessionImages,
    retryProcessing: () => {},
    clearQueue: () => {},
    runCleanup: () => {},
    loadUserImages: () => {},
    setImages: () => {},
    clearOldApiKey: () => false,
    checkDuplicateImage: () => Promise.resolve(false)
  };
};

export default useImageProcessing;
