
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { ImageData } from "@/types/ImageData";
import { useImageState } from "@/hooks/useImageState";
import { useOcrProcessing } from "@/hooks/useOcrProcessing";
import { useGeminiProcessing } from "@/hooks/useGeminiProcessing";
import { useSubmitToApi } from "@/hooks/useSubmitToApi";
import { createReliableBlobUrl } from "@/lib/gemini/utils";

// Constants for batch processing
const BATCH_SIZE = 5; // Process 5 images at a time
const BATCH_DELAY = 1000; // 1 second delay between batches

export const useImageProcessing = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingQueue, setProcessingQueue] = useState<File[]>([]);
  const [queueTotal, setQueueTotal] = useState(0);
  const { toast } = useToast();
  
  const { images, addImage, updateImage, deleteImage, handleTextChange } = useImageState();
  const { processWithOcr } = useOcrProcessing();
  const { useGemini, processWithGemini } = useGeminiProcessing();
  const { isSubmitting, handleSubmitToApi: submitToApi } = useSubmitToApi(updateImage);

  /**
   * Process images in batches to avoid overwhelming the system
   */
  const processBatch = useCallback(async () => {
    if (processingQueue.length === 0) {
      console.log("Processing queue is empty, finishing");
      setIsProcessing(false);
      setProcessingProgress(100);
      
      if (queueTotal > 0) {
        toast({
          title: "تم معالجة الصور بنجاح",
          description: `تم معالجة ${queueTotal} صورة${useGemini ? " باستخدام Gemini AI" : ""}`,
          variant: "default"
        });
      }
      
      setQueueTotal(0);
      return;
    }
    
    const startingNumber = images.length > 0 ? Math.max(...images.map(img => img.number || 0)) + 1 : 1;
    console.log("Starting number for new batch:", startingNumber);
    
    // Take a batch from the queue
    const currentBatch = processingQueue.slice(0, BATCH_SIZE);
    const remainingQueue = processingQueue.slice(BATCH_SIZE);
    setProcessingQueue(remainingQueue);
    
    console.log(`Processing batch of ${currentBatch.length} images, ${remainingQueue.length} remaining in queue`);
    
    // Process images in the current batch concurrently
    const batchPromises = currentBatch.map(async (file, index) => {
      try {
        console.log("Processing file:", file.name, "type:", file.type);
        
        if (!file.type.startsWith("image/")) {
          toast({
            title: "خطأ في نوع الملف",
            description: "يرجى تحميل صور فقط",
            variant: "destructive"
          });
          console.log("File is not an image, skipping");
          return;
        }
        
        // Create a more reliable blob URL
        const previewUrl = createReliableBlobUrl(file);
        console.log("Created preview URL:", previewUrl);
        
        if (!previewUrl) {
          toast({
            title: "خطأ في تحميل الصورة",
            description: "فشل في إنشاء معاينة للصورة",
            variant: "destructive"
          });
          return;
        }
        
        const newImage: ImageData = {
          id: crypto.randomUUID(),
          file,
          previewUrl,
          extractedText: "",
          date: new Date(),
          status: "processing",
          number: startingNumber + index
        };
        
        addImage(newImage);
        console.log("Added new image to state with ID:", newImage.id);
        
        try {
          let processedImage: ImageData;
          
          if (useGemini) {
            console.log("Using Gemini API for extraction");
            processedImage = await processWithGemini(
              file, 
              newImage, 
              processWithOcr
            );
          } else {
            console.log("No Gemini API key, using OCR directly");
            processedImage = await processWithOcr(file, newImage);
          }
          
          updateImage(newImage.id, processedImage);
        } catch (error) {
          console.error("General error in image processing:", error);
          updateImage(newImage.id, { status: "error" });
          
          toast({
            title: "فشل في استخراج النص",
            description: "حدث خطأ أثناء معالجة الصورة",
            variant: "destructive"
          });
        }
      } catch (fileError) {
        console.error("Error processing file:", fileError);
      }
    });
    
    // Wait for all images in the batch to be processed
    await Promise.all(batchPromises);
    
    // Update progress
    const processedCount = queueTotal - remainingQueue.length;
    const progress = Math.round(processedCount / queueTotal * 100);
    console.log("Processing progress:", progress + "%");
    setProcessingProgress(progress);
    
    // Process next batch with a delay to prevent overwhelming the system
    if (remainingQueue.length > 0) {
      setTimeout(() => {
        processBatch();
      }, BATCH_DELAY);
    } else {
      // Done processing all images
      setIsProcessing(false);
      console.log("Image processing completed for all batches");
      
      toast({
        title: "تم معالجة الصور بنجاح",
        description: `تم معالجة ${queueTotal} صورة${useGemini ? " باستخدام Gemini AI" : ""}`,
        variant: "default"
      });
      
      setQueueTotal(0);
    }
  }, [processingQueue, queueTotal, images, addImage, updateImage, processWithOcr, processWithGemini, useGemini, toast]);

  /**
   * Handle file selection and start processing queue
   */
  const handleFileChange = useCallback(async (files: FileList | null) => {
    console.log("handleFileChange called with files:", files);
    if (!files || files.length === 0) {
      console.log("No files selected");
      return;
    }
    
    const fileArray = Array.from(files);
    console.log("Adding", fileArray.length, "files to processing queue");
    
    // Add files to queue and start processing if not already processing
    setProcessingQueue(prevQueue => [...prevQueue, ...fileArray]);
    setQueueTotal(prevTotal => prevTotal + fileArray.length);
    setProcessingProgress(0);
    
    if (!isProcessing) {
      setIsProcessing(true);
      // Use setTimeout to allow the state update to complete first
      setTimeout(() => {
        processBatch();
      }, 0);
    }
  }, [isProcessing, processBatch]);

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
