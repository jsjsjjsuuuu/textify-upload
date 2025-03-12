
import { useState } from "react";
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";
import { createReliableBlobUrl, formatPrice } from "@/lib/gemini/utils";

export const useFileProcessing = (
  images: ImageData[],
  addImage: (image: ImageData) => void,
  updateImage: (id: string, fields: Partial<ImageData>) => void,
  processWithOcr: (file: File, image: ImageData) => Promise<ImageData>,
  processWithGemini: (file: File, image: ImageData, fallbackProcessor: typeof processWithOcr) => Promise<ImageData>,
  useGemini: boolean
) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const { toast } = useToast();

  const handleFileChange = async (files: FileList | null) => {
    console.log("handleFileChange called with files:", files);
    if (!files || files.length === 0) {
      console.log("No files selected");
      return;
    }
    
    setIsProcessing(true);
    setProcessingProgress(0);
    
    const fileArray = Array.from(files);
    console.log("Processing", fileArray.length, "files");
    
    const totalFiles = fileArray.length;
    let processedFiles = 0;
    
    const startingNumber = images.length > 0 ? Math.max(...images.map(img => img.number || 0)) + 1 : 1;
    console.log("Starting number for new images:", startingNumber);
    
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      console.log("Processing file:", file.name, "type:", file.type);
      
      if (!file.type.startsWith("image/")) {
        toast({
          title: "خطأ في نوع الملف",
          description: "يرجى تحميل صور فقط",
          variant: "destructive"
        });
        console.log("File is not an image, skipping");
        continue;
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
        continue;
      }
      
      const newImage: ImageData = {
        id: crypto.randomUUID(),
        file,
        previewUrl,
        extractedText: "",
        date: new Date(),
        status: "processing",
        number: startingNumber + i
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
        
        // إذا كان هناك سعر، نتأكد من تنسيقه بشكل صحيح
        if (processedImage.price) {
          const originalPrice = processedImage.price;
          processedImage.price = formatPrice(originalPrice);
          
          if (originalPrice !== processedImage.price) {
            console.log(`تم تنسيق السعر تلقائيًا بعد المعالجة: "${originalPrice}" -> "${processedImage.price}"`);
          }
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
      
      processedFiles++;
      const progress = Math.round(processedFiles / totalFiles * 100);
      console.log("Processing progress:", progress + "%");
      setProcessingProgress(progress);
    }
    
    setIsProcessing(false);
    console.log("Image processing completed");
    
    if (processedFiles > 0) {
      toast({
        title: "تم معالجة الصور بنجاح",
        description: `تم معالجة ${processedFiles} صورة${useGemini ? " باستخدام Gemini AI" : ""}`,
        variant: "default"
      });
    }
  };

  return {
    isProcessing,
    processingProgress,
    handleFileChange
  };
};
