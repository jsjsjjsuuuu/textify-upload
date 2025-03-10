
import { useCallback } from "react";
import { ImageData } from "@/types/ImageData";
import { useImageState } from "@/hooks/useImageState";
import { useOcrProcessing } from "@/hooks/useOcrProcessing";
import { useGeminiProcessing } from "@/hooks/useGeminiProcessing";
import { useSubmitToApi } from "@/hooks/useSubmitToApi";
import { useProcessingQueue } from "@/hooks/useProcessingQueue";
import { useBatchProcessing } from "@/hooks/useBatchProcessing";
import { useFileUpload } from "@/hooks/useFileUpload";

export const useImageProcessing = () => {
  // Core image state management
  const { images, addImage, updateImage, deleteImage, handleTextChange } = useImageState();
  
  // Processing methods
  const { processWithOcr } = useOcrProcessing();
  const { useGemini, processWithGemini } = useGeminiProcessing();
  const { isSubmitting, handleSubmitToApi: submitToApi } = useSubmitToApi(updateImage);

  // Queue management
  const {
    isProcessing,
    processingProgress,
    queueTotal,
    addToQueue,
    getNextBatch,
    updateQueueAfterBatch,
    startProcessing,
    finishProcessing
  } = useProcessingQueue();

  // Batch processing logic
  const { processBatch } = useBatchProcessing(
    images,
    addImage,
    updateImage,
    getNextBatch,
    updateQueueAfterBatch,
    finishProcessing,
    queueTotal,
    processWithOcr,
    processWithGemini,
    useGemini
  );

  // File upload handling
  const { handleFileChange } = useFileUpload(
    addToQueue,
    startProcessing,
    processBatch
  );

  // API submission
  const handleSubmitToApi = useCallback((id: string) => {
    const image = images.find(img => img.id === id);
    if (image) {
      submitToApi(id, image);
    }
  }, [images, submitToApi]);

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
