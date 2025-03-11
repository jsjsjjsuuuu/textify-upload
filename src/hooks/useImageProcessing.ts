
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ImageData } from "@/types/ImageData";
import { useImageState } from "@/hooks/useImageState";
import { useOcrProcessing } from "@/hooks/useOcrProcessing";
import { useGeminiProcessing } from "@/hooks/useGeminiProcessing";
import { useSubmitToApi } from "@/hooks/useSubmitToApi";
import { createReliableBlobUrl, formatPrice } from "@/lib/gemini/utils";
import { validateImageData, formatImageData, prepareNewImage } from "@/utils/dataValidation";

export const useImageProcessing = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const { toast } = useToast();
  
  const { images, addImage, updateImage, deleteImage, handleTextChange } = useImageState();
  const { processWithOcr } = useOcrProcessing();
  const { useGemini, processWithGemini } = useGeminiProcessing();
  const { isSubmitting, handleSubmitToApi: submitToApi } = useSubmitToApi(updateImage);

  // تخصيص معالج تغيير النص لتنسيق السعر تلقائيًا
  const handleCustomTextChange = (id: string, field: string, value: string) => {
    // إذا كان الحقل هو السعر، نتحقق من التنسيق
    if (field === "price" && value) {
      const originalValue = value;
      const formattedValue = formatPrice(value);
      
      // إذا كان التنسيق مختلفًا عن القيمة الأصلية، نستخدم القيمة المنسقة
      if (formattedValue !== originalValue) {
        console.log(`تنسيق السعر تلقائيًا: "${originalValue}" -> "${formattedValue}"`);
        value = formattedValue;
        
        // إظهار إشعار بالتغيير
        toast({
          title: "تم تنسيق السعر تلقائيًا",
          description: `تم تحويل "${originalValue}" إلى "${formattedValue}"`,
          variant: "default"
        });
      }
    }
    
    // استدعاء معالج تغيير النص الأصلي
    handleTextChange(id, field, value);
  };

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
      
      // إعداد الصورة الجديدة باستخدام الدالة المساعدة
      const newImage = prepareNewImage(file, previewUrl, startingNumber + i);
      
      addImage(newImage);
      console.log("Added new image to state with ID:", newImage.id);
      
      try {
        let processedImage: ImageData;
        
        if (useGemini) {
          console.log("Using Gemini API for extraction");
          processedImage = await processWithGemini(file, newImage, processWithOcr);
        } else {
          console.log("No Gemini API key, using OCR directly");
          processedImage = await processWithOcr(file, newImage);
        }
        
        // تنسيق البيانات المستخرجة
        processedImage = formatImageData(processedImage);
        
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

  const handleSubmitToApi = (id: string) => {
    const image = images.find(img => img.id === id);
    if (!image) return;
    
    // التحقق من صحة البيانات قبل الإرسال
    const validation = validateImageData(image);
    
    if (!validation.valid) {
      toast({
        title: "لا يمكن إرسال البيانات",
        description: validation.errors.join("، "),
        variant: "destructive"
      });
      return;
    }
    
    submitToApi(id, image);
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
