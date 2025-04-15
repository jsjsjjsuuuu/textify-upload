
import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "../use-toast";
import type { ImageData } from "@/types/ImageData";

interface FileProcessingConfig {
  addImage: (image: ImageData) => void;
  updateImage: (id: string, data: Partial<ImageData>) => void;
  processWithOcr: (file: File, image: ImageData) => Promise<ImageData>;
  processWithGemini: (file: File | Blob, image: ImageData) => Promise<ImageData>;
  createSafeObjectURL: (file: File | Blob) => Promise<string>;
  saveProcessedImage?: (image: ImageData) => Promise<void>;
  user?: { id: string } | null;
  images: ImageData[];
}

export const useFileProcessing = ({
  addImage,
  updateImage,
  processWithOcr,
  processWithGemini,
  createSafeObjectURL,
  saveProcessedImage,
  user,
  images
}: FileProcessingConfig) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [activeUploads, setActiveUploads] = useState(0);
  const [queueLength, setQueueLength] = useState(0);
  const { toast } = useToast();

  const processFile = useCallback(async (file: File) => {
    try {
      const previewUrl = await createSafeObjectURL(file);
      
      const imageData: ImageData = {
        id: uuidv4(),
        file,
        previewUrl,
        date: new Date(),
        status: "processing",
        userId: user?.id, // استخدام userId بدلاً من user_id
        sessionImage: true
      };

      addImage(imageData);
      
      try {
        const result = await processWithGemini(file, imageData);
        updateImage(imageData.id, { ...result, status: "completed" });
        
        if (saveProcessedImage) {
          await saveProcessedImage(result);
        }
      } catch (error) {
        console.error("خطأ في المعالجة:", error);
        updateImage(imageData.id, { status: "error" });
      }
    } catch (error) {
      console.error("خطأ في معالجة الملف:", error);
      toast({
        title: "خطأ في المعالجة",
        description: "حدث خطأ أثناء معالجة الملف"
      });
    }
  }, [addImage, updateImage, processWithGemini, saveProcessedImage, user, createSafeObjectURL, toast]);

  const handleFileChange = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    setQueueLength(fileArray.length);
    setIsProcessing(true);
    
    for (let i = 0; i < fileArray.length; i++) {
      await processFile(fileArray[i]);
      const progress = ((i + 1) / fileArray.length) * 100;
      setProcessingProgress(progress);
    }
    
    setIsProcessing(false);
    setProcessingProgress(100);
  }, [processFile]);

  return {
    isProcessing,
    processingProgress,
    activeUploads,
    queueLength,
    handleFileChange
  };
};
