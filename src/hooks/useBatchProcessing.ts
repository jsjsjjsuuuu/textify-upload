
import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { ImageData } from "@/types/ImageData";
import { createReliableBlobUrl } from "@/lib/gemini/utils";
import { BATCH_DELAY } from "./useProcessingQueue";

export const useBatchProcessing = (
  images: ImageData[],
  addImage: (newImage: ImageData) => void,
  updateImage: (id: string, updatedFields: Partial<ImageData>) => void,
  getNextBatch: () => { batch: File[], remaining: File[] },
  updateQueueAfterBatch: (remainingQueue: File[]) => void,
  finishProcessing: (success: boolean) => void,
  queueTotal: number,
  processWithOcr: (file: File, image: ImageData) => Promise<ImageData>,
  processWithGemini: (file: File, image: ImageData, fallbackProcessor: (file: File, image: ImageData) => Promise<ImageData>) => Promise<ImageData>,
  useGemini: boolean
) => {
  const { toast } = useToast();

  /**
   * Process images in batches to avoid overwhelming the system
   */
  const processBatch = useCallback(async () => {
    const { batch, remaining } = getNextBatch();
    
    if (batch.length === 0) {
      console.log("Processing queue is empty, finishing");
      finishProcessing(true);
      
      if (queueTotal > 0) {
        toast({
          title: "تم معالجة الصور بنجاح",
          description: `تم معالجة ${queueTotal} صورة${useGemini ? " باستخدام Gemini AI" : ""}`,
          variant: "default"
        });
      }
      
      return;
    }
    
    const startingNumber = images.length > 0 ? Math.max(...images.map(img => img.number || 0)) + 1 : 1;
    console.log("Starting number for new batch:", startingNumber);
    
    console.log(`Processing batch of ${batch.length} images, ${remaining.length} remaining in queue`);
    
    // Process images in the current batch concurrently
    const batchPromises = batch.map(async (file, index) => {
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
    
    // Update queue state
    updateQueueAfterBatch(remaining);
    
    // Process next batch with a delay to prevent overwhelming the system
    if (remaining.length > 0) {
      setTimeout(() => {
        processBatch();
      }, BATCH_DELAY);
    } else {
      // Done processing all images
      finishProcessing(true);
      console.log("Image processing completed for all batches");
      
      toast({
        title: "تم معالجة الصور بنجاح",
        description: `تم معالجة ${queueTotal} صورة${useGemini ? " باستخدام Gemini AI" : ""}`,
        variant: "default"
      });
    }
  }, [
    getNextBatch, 
    updateQueueAfterBatch, 
    finishProcessing, 
    queueTotal, 
    images, 
    addImage, 
    updateImage, 
    processWithOcr, 
    processWithGemini, 
    useGemini, 
    toast
  ]);

  return {
    processBatch
  };
};
