
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { createReliableBlobUrl } from "@/utils/parsing/formatters";
import { ImageData } from "@/types/ImageData";

export const useFileUpload = (
  images: ImageData[],
  addImage: (image: ImageData) => void
) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const { toast } = useToast();

  const calculateStartingNumber = () => {
    return images.length > 0 
      ? Math.max(...images.map(img => img.number || 0)) + 1 
      : 1;
  };

  const createNewImage = (file: File, previewUrl: string, startingNumber: number, index: number): ImageData => {
    return {
      id: crypto.randomUUID(),
      file,
      previewUrl,
      extractedText: "",
      date: new Date(),
      status: "processing",
      number: startingNumber + index
    };
  };

  const validateFile = (file: File): boolean => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "خطأ في نوع الملف",
        description: "يرجى تحميل صور فقط",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const validatePreviewUrl = (previewUrl: string | null): boolean => {
    if (!previewUrl) {
      toast({
        title: "خطأ في تحميل الصورة",
        description: "فشل في إنشاء معاينة للصورة",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const updateProgress = (processed: number, total: number) => {
    const progress = Math.round(processed / total * 100);
    setProcessingProgress(progress);
  };

  return {
    isProcessing,
    processingProgress,
    setIsProcessing,
    setProcessingProgress,
    calculateStartingNumber,
    createNewImage,
    validateFile,
    validatePreviewUrl,
    updateProgress
  };
};
