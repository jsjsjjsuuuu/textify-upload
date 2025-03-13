
import { useState } from "react";
import { ImageData } from "@/types/ImageData";
import { useImageState } from "@/hooks/useImageState";
import { useOcrProcessing } from "@/hooks/useOcrProcessing";
import { useGeminiProcessing } from "@/hooks/useGeminiProcessing";
import { useSubmitToApi } from "@/hooks/useSubmitToApi";
import { useCustomTextHandlers } from "@/hooks/useCustomTextHandlers";
import { useDataValidation } from "@/hooks/useDataValidation";
import { useFileProcessing } from "@/hooks/useFileProcessing";
import { useToast } from "@/hooks/use-toast";

export const useImageProcessing = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
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
  const { 
    handleSubmitToApi: submitToApi, 
    handleRetrySubmit: retrySubmit,
    isSubmitting: apiSubmitting,
    retryCount 
  } = useSubmitToApi(updateImage);
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
    if (!image) {
      toast({
        title: "خطأ في الإرسال",
        description: "الصورة غير موجودة",
        variant: "destructive"
      });
      return;
    }
    
    const { isValid, errorMessages } = validateImageData(image);
    
    if (!isValid) {
      toast({
        title: "بيانات غير مكتملة",
        description: errorMessages?.join("، ") || "يرجى التأكد من اكتمال جميع البيانات المطلوبة",
        variant: "destructive"
      });
      return;
    }
    
    submitToApi(id, image);
  };

  const handleRetrySubmitToApi = (id: string) => {
    const image = images.find(img => img.id === id);
    if (!image) {
      toast({
        title: "خطأ في الإرسال",
        description: "الصورة غير موجودة",
        variant: "destructive"
      });
      return;
    }
    
    retrySubmit(id, image);
  };

  return {
    images,
    isLoading,
    isProcessing,
    processingProgress,
    isSubmitting: apiSubmitting,
    retryCount,
    useGemini,
    handleFileChange,
    handleTextChange: handleCustomTextChange,
    handleDelete: deleteImage,
    handleSubmitToApi,
    handleRetrySubmitToApi
  };
};
