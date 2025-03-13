
import { useState } from "react";
import { ImageData } from "@/types/ImageData";
import { useImageState } from "@/hooks/useImageState";
import { useOcrProcessing } from "@/hooks/useOcrProcessing";
import { useGeminiProcessing } from "@/hooks/useGeminiProcessing";
import { useSubmitToApi } from "@/hooks/useSubmitToApi";
import { useCustomTextHandlers } from "@/hooks/useCustomTextHandlers";
import { useDataValidation } from "@/hooks/useDataValidation";
import { useFileProcessing } from "@/hooks/useFileProcessing";

export const useImageProcessing = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { 
    images, 
    isLoading, 
    addImage, 
    updateImage, 
    deleteImage, 
    handleTextChange 
  } = useImageState();
  
  const { processWithOcr } = useOcrProcessing();
  const { useGemini, processWithGemini } = useGeminiProcessing();
  const { handleSubmitToApi: submitToApi } = useSubmitToApi(updateImage);
  const { handleCustomTextChange } = useCustomTextHandlers(handleTextChange);
  const { validateImageData } = useDataValidation();
  const { isProcessing, processingProgress, handleFileChange } = useFileProcessing(
    images,
    addImage,
    updateImage,
    processWithOcr,
    processWithGemini,
    useGemini
  );

  const handleSubmitToApi = (id: string) => {
    const image = images.find(img => img.id === id);
    if (image) {
      const { isValid } = validateImageData(image);
      
      if (!isValid) {
        return;
      }
      
      submitToApi(id, image);
    }
  };

  return {
    images,
    isLoading,
    isProcessing,
    processingProgress,
    isSubmitting,
    useGemini,
    handleFileChange,
    handleTextChange: handleCustomTextChange,
    handleDelete: deleteImage,
    handleSubmitToApi
  };
};
