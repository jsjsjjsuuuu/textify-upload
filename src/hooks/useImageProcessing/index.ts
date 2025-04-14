import { useCallback } from "react";
import { useFileProcessing } from "../useFileProcessing";
import { useOcrProcessing } from "../useOcrProcessing";
import { useGeminiProcessing } from "../useGeminiProcessing";
import { useImageState } from "../imageState";
import { useImageDatabase } from "../useImageDatabase";
import { useToast } from "../use-toast";
import { useFileHandlers } from "../useFileHandlers";
import { useAuth } from "@/contexts/AuthContext";
import type { ImageData } from "@/types/ImageData";
import { useState } from "react";
import { formatDate } from "@/utils/dateFormatter";
import { useDuplicateDetection } from "../useDuplicateDetection";
import { useEffect } from "react";

export const useImageProcessing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { 
    images, 
    updateImage,
    hiddenImageIds,
    addImage, 
    deleteImage, 
    handleTextChange,
    clearSessionImages,
    hideImage,
    unhideImage,
    unhideAllImages,
    getHiddenImageIds,
    setAllImages,
    createSafeObjectURL
  } = useImageState();

  const { processWithOcr, processFileWithOcr } = useOcrProcessing();
  const { processWithGemini, processFileWithGemini } = useGeminiProcessing();
  
  const fileProcessingResult = useFileProcessing({
    images,
    addImage,
    updateImage,
    processWithOcr: processFileWithOcr,
    processWithGemini: processFileWithGemini,
    saveProcessedImage: saveImageToDatabase,
    user,
    createSafeObjectURL: async (file: File) => {
      return await createSafeObjectURL(file);
    },
    checkDuplicateImage: undefined,
    markImageAsProcessed: undefined
  });
  
  const { isDuplicateImage, markImageAsProcessed } = useDuplicateDetection({ enabled: false });
  
  const { 
    isProcessing, 
    processingProgress, 
    handleFileChange: fileUploadHandler, 
    activeUploads, 
    queueLength,
  } = fileProcessingResult;

  const { handleSubmitToApi } = useFileHandlers(updateImage);

  const [isLoadingUserImages, setIsLoadingUserImages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});

  return {
    images,
    hiddenImageIds,
    isProcessing,
    processingProgress,
    isSubmitting,
    activeUploads,
    queueLength,
    isLoadingUserImages,
    handleFileChange: (files: FileList | File[]) => {
      fileUploadHandler(files);
    },
    handleTextChange,
    handleDelete: async (id: string) => {
      try {
        return deleteImage(id, false);
      } catch (error) {
        console.error("Error deleting image:", error);
        return false;
      }
    },
    handleSubmitToApi,
    saveImageToDatabase,
    formatDate,
    hideImage,
    unhideImage,
    unhideAllImages,
    getHiddenImageIds,
    clearSessionImages,
    loadUserImages: (callback?: (images: ImageData[]) => void) => {
      if (user) {
        fetchUserImages(user.id, (loadedImages) => {
          const visibleImages = loadedImages.filter(img => !hiddenImageIds.includes(img.id));
          
          if (callback) {
            callback(visibleImages);
          } else {
            setAllImages(visibleImages);
          }
          
          setIsLoadingUserImages(false);
        });
      }
    },
    clearOldApiKey: () => {
      const oldApiKey = "AIzaSyCwxG0KOfzG0HTHj7qbwjyNGtmPLhBAno8";
      const storedApiKey = localStorage.getItem("geminiApiKey");
      
      if (storedApiKey === oldApiKey) {
        localStorage.removeItem("geminiApiKey");
        const newApiKey = "AIzaSyC4d53RxIXV4WIXWcNAN1X-9WPZbS4z7Q0";
        localStorage.setItem("geminiApiKey", newApiKey);
        
        toast({
          title: "تم تحديث مفتاح API",
          description: "تم تحديث مفتاح Gemini API بنجاح",
        });
        
        return true;
      }
      
      return false;
    },
    checkDuplicateImage: () => Promise.resolve(false)
  };
};
