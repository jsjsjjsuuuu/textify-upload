
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
  
  const { images, addImage, updateImage, deleteImage, handleTextChange } = useImageState();
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

  const handleSubmitToApi = async (id: string) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const image = images.find(img => img.id === id);
      
      if (!image) {
        toast({
          title: "خطأ",
          description: "لم يتم العثور على الصورة المطلوبة",
          variant: "destructive"
        });
        return;
      }
      
      const { isValid, errors } = validateImageData(image);
      
      if (!isValid) {
        const errorMessage = errors.join("، ");
        toast({
          title: "بيانات غير صالحة",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }
      
      await submitToApi(id, image);
    } catch (error) {
      console.error("خطأ عام في عملية الإرسال:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ غير متوقع أثناء الإرسال",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    images,
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
