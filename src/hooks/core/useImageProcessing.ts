
import { useState, useCallback } from "react";
import { useImageState } from "./useImageState";
import { useOcrProcessing } from "../useOcrProcessing";
import { useGeminiProcessing } from "../useGeminiProcessing";
import { useToast } from "../use-toast";
import { useFileProcessing } from "../useFileProcessing";
import { useImageDatabase } from "../useImageDatabase";
import { useAuth } from "@/contexts/AuthContext";

export const useImageProcessing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoadingUserImages, setIsLoadingUserImages] = useState(false);

  const {
    images,
    hiddenImageIds,
    addImage,
    updateImage,
    deleteImage,
    hideImage,
    clearSessionImages,
    setAllImages,
    createSafeObjectURL
  } = useImageState();

  const { processWithOcr } = useOcrProcessing();
  const { processWithGemini } = useGeminiProcessing();
  const { loadUserImages, saveImageToDatabase } = useImageDatabase(updateImage);

  const {
    isProcessing,
    processingProgress,
    activeUploads,
    queueLength,
    handleFileChange: fileUploadHandler
  } = useFileProcessing({
    images,
    addImage,
    updateImage,
    processWithOcr,
    processWithGemini,
    saveProcessedImage: saveImageToDatabase,
    user,
    createSafeObjectURL
  });

  const handleFileChange = useCallback((files: FileList | File[]) => {
    fileUploadHandler(files);
  }, [fileUploadHandler]);

  return {
    images,
    hiddenImageIds,
    isProcessing,
    processingProgress,
    activeUploads,
    queueLength,
    isLoadingUserImages,
    handleFileChange,
    handleDelete: deleteImage,
    saveImageToDatabase,
    hideImage,
    clearSessionImages,
    loadUserImages: (callback?: (images: any[]) => void) => {
      if (user) {
        setIsLoadingUserImages(true);
        loadUserImages(user.id, (loadedImages) => {
          const visibleImages = loadedImages.filter(img => !hiddenImageIds.includes(img.id));
          callback ? callback(visibleImages) : setAllImages(visibleImages);
          setIsLoadingUserImages(false);
        });
      }
    }
  };
};
