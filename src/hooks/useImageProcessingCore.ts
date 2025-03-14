
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ImageData } from "@/types/ImageData";
import { useImageState } from "@/hooks/useImageState";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useSubmission } from "@/hooks/useSubmission";
import { saveToLocalStorage } from "@/utils/bookmarklet";

export const useImageProcessingCore = () => {
  const [processingProgress, setProcessingProgress] = useState(0);
  const { toast } = useToast();
  
  const { 
    images, 
    addImage, 
    updateImage, 
    deleteImage, 
    handleTextChange 
  } = useImageState();
  
  const { 
    isProcessing, 
    useGemini, 
    handleFileChange 
  } = useFileUpload({
    images,
    addImage,
    updateImage,
    setProcessingProgress
  });
  
  const { 
    isSubmitting, 
    handleSubmitToApi 
  } = useSubmission(updateImage);

  // حفظ البيانات المكتملة في localStorage
  useEffect(() => {
    // استخراج الصور المكتملة فقط
    const completedImages = images.filter(img => 
      img.status === "completed" && img.code && img.senderName && img.phoneNumber
    );
    
    // حفظ البيانات فقط إذا كان هناك صور مكتملة
    if (completedImages.length > 0) {
      console.log("حفظ البيانات المكتملة في localStorage:", completedImages.length, "صورة");
      saveToLocalStorage(completedImages);
    }
  }, [images]);

  return {
    images,
    isProcessing,
    processingProgress,
    isSubmitting,
    useGemini,
    handleFileChange,
    handleTextChange,
    handleDelete: deleteImage,
    handleSubmitToApi
  };
};
