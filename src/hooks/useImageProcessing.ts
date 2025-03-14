import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ImageData } from "@/types/ImageData";
import { useImageState } from "@/hooks/useImageState";
import { useOcrProcessing } from "@/hooks/useOcrProcessing";
import { useGeminiProcessing } from "@/hooks/useGeminiProcessing";
import { useSubmitToApi } from "@/hooks/useSubmitToApi";
import { createReliableBlobUrl, formatPrice } from "@/lib/gemini/utils";
import { correctProvinceName } from "@/utils/provinces";
import { saveToLocalStorage } from "@/utils/bookmarklet";

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
    
    // معالجة حقل رقم الهاتف لإزالة الأحرف غير الرقمية
    if (field === "phoneNumber" && value) {
      const originalValue = value;
      const cleanedValue = value.replace(/[^\d+]/g, '');
      
      if (cleanedValue !== originalValue) {
        console.log(`تنظيف رقم الهاتف تلقائيًا: "${originalValue}" -> "${cleanedValue}"`);
        value = cleanedValue;
        
        toast({
          title: "تم تنظيف رقم الهاتف",
          description: `تم إزالة الرموز غير الرقمية`,
          variant: "default"
        });
      }
    }
    
    // معالجة حقل المحافظة لتصحيح الأخطاء الإملائية
    if (field === "province" && value) {
      const originalValue = value;
      const correctedValue = correctProvinceName(value);
      
      if (correctedValue !== originalValue) {
        console.log(`تصحيح اسم المحافظة تلقائيًا: "${originalValue}" -> "${correctedValue}"`);
        value = correctedValue;
        
        toast({
          title: "تم تصحيح اسم المحافظة",
          description: `تم تصحيح "${originalValue}" إلى "${correctedValue}"`,
          variant: "default"
        });
      }
    }
    
    // استدعاء معالج تغيير النص الأصلي
    handleTextChange(id, field, value);
    
    // حفظ البيانات في localStorage بعد كل تغيير مهم
    if (["code", "senderName", "phoneNumber", "province", "price"].includes(field)) {
      setTimeout(() => {
        const completedImages = images.filter(img => img.status === "completed");
        if (completedImages.length > 0) {
          saveToLocalStorage(completedImages);
        }
      }, 1000);
    }
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
        
        // تنظيف رقم الهاتف تلقائيًا بعد المعالجة
        if (processedImage.phoneNumber) {
          const originalPhone = processedImage.phoneNumber;
          processedImage.phoneNumber = originalPhone.replace(/[^\d+]/g, '');
          
          if (originalPhone !== processedImage.phoneNumber) {
            console.log(`تم تنظيف رقم الهاتف تلقائيًا بعد المعالجة: "${originalPhone}" -> "${processedImage.phoneNumber}"`);
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

  const handleSubmitToApi = (id: string) => {
    const image = images.find(img => img.id === id);
    if (image) {
      // التحقق من صحة البيانات قبل الإرسال
      let hasErrors = false;
      let errorMessages = [];
      
      // التحقق من رقم الهاتف
      if (image.phoneNumber && image.phoneNumber.replace(/[^\d]/g, '').length !== 11) {
        hasErrors = true;
        errorMessages.push("رقم الهاتف غير صحيح (يجب أن يكون 11 رقم)");
      }
      
      // التحقق من السعر
      if (image.price) {
        const cleanedPrice = image.price.toString().replace(/[^\d.]/g, '');
        const numValue = parseFloat(cleanedPrice);
        if (numValue > 0 && numValue < 1000 && image.price !== '0') {
          hasErrors = true;
          errorMessages.push("السعر غير صحيح (يجب أن يكون 1000 أو أكبر أو 0)");
        }
      }
      
      if (hasErrors) {
        toast({
          title: "لا يمكن إرسال البيانات",
          description: errorMessages.join("، "),
          variant: "destructive"
        });
        return;
      }
      
      // حفظ البيانات في localStorage قبل الإرسال للتأكد من أنها محفوظة
      const completedImages = images.filter(img => img.status === "completed");
      if (completedImages.length > 0) {
        saveToLocalStorage(completedImages);
      }
      
      submitToApi(id, image);
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
