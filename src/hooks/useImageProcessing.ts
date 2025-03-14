
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ImageData } from "@/types/ImageData";
import { useImageState } from "@/hooks/useImageState";
import { useOcrProcessing } from "@/hooks/useOcrProcessing";
import { useGeminiProcessing } from "@/hooks/useGeminiProcessing";
import { useSubmitToApi } from "@/hooks/useSubmitToApi";
import { createReliableBlobUrl, formatPrice } from "@/lib/gemini/utils";
import { correctProvinceName } from "@/utils/provinces";
import { saveToLocalStorage, getStorageStats, getStoredItemsCount } from "@/utils/bookmarklet";

export const useImageProcessing = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const { toast } = useToast();
  
  const { images, addImage, updateImage, deleteImage, handleTextChange } = useImageState();
  const { processWithOcr } = useOcrProcessing();
  const { useGemini, processWithGemini } = useGeminiProcessing();
  const { isSubmitting, handleSubmitToApi: submitToApi } = useSubmitToApi(updateImage);

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

  // تخصيص معالج تغيير النص لتنسيق السعر وتنظيف رقم الهاتف تلقائيًا
  const handleCustomTextChange = (id: string, field: string, value: string) => {
    console.log(`معالجة تغيير النص: ${field} = "${value}" للصورة ${id}`);
    
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
  };

  const handleFileChange = async (files: FileList | null) => {
    console.log("معالجة الملفات:", files?.length);
    if (!files || files.length === 0) {
      console.log("لم يتم اختيار ملفات");
      return;
    }
    
    setIsProcessing(true);
    setProcessingProgress(0);
    
    const fileArray = Array.from(files);
    console.log("معالجة", fileArray.length, "ملفات");
    
    const totalFiles = fileArray.length;
    let processedFiles = 0;
    
    const startingNumber = images.length > 0 ? Math.max(...images.map(img => img.number || 0)) + 1 : 1;
    console.log("رقم بداية الصور الجديدة:", startingNumber);
    
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      console.log("معالجة الملف:", file.name, "النوع:", file.type);
      
      if (!file.type.startsWith("image/")) {
        toast({
          title: "خطأ في نوع الملف",
          description: "يرجى تحميل صور فقط",
          variant: "destructive"
        });
        console.log("الملف ليس صورة، تخطي");
        continue;
      }
      
      // إنشاء عنوان URL أكثر موثوقية للكائن
      const previewUrl = createReliableBlobUrl(file);
      console.log("تم إنشاء عنوان URL للمعاينة:", previewUrl);
      
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
      console.log("تمت إضافة صورة جديدة إلى الحالة بالمعرف:", newImage.id);
      
      try {
        let processedImage: ImageData;
        
        if (useGemini) {
          console.log("استخدام Gemini API للاستخراج");
          processedImage = await processWithGemini(
            file, 
            newImage, 
            processWithOcr
          );
        } else {
          console.log("لا يوجد مفتاح Gemini API، استخدام OCR مباشرة");
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
        
        // تحديث حالة الصورة إلى "مكتملة" إذا كانت تحتوي على جميع البيانات الأساسية
        if (processedImage.code && processedImage.senderName && processedImage.phoneNumber) {
          processedImage.status = "completed";
        } else {
          processedImage.status = "pending";
        }
        
        updateImage(newImage.id, processedImage);
        console.log("تم تحديث الصورة بالبيانات المستخرجة:", newImage.id);
      } catch (error) {
        console.error("خطأ عام في معالجة الصورة:", error);
        updateImage(newImage.id, { status: "error" });
        
        toast({
          title: "فشل في استخراج النص",
          description: "حدث خطأ أثناء معالجة الصورة",
          variant: "destructive"
        });
      }
      
      processedFiles++;
      const progress = Math.round(processedFiles / totalFiles * 100);
      console.log("تقدم المعالجة:", progress + "%");
      setProcessingProgress(progress);
    }
    
    setIsProcessing(false);
    console.log("اكتملت معالجة الصور");
    
    if (processedFiles > 0) {
      toast({
        title: "تم معالجة الصور بنجاح",
        description: `تم معالجة ${processedFiles} صورة${useGemini ? " باستخدام Gemini AI" : ""}`,
        variant: "default"
      });
      
      // تحديث إحصائيات التخزين
      console.log("إعادة حفظ البيانات في localStorage");
      const completedImages = images.filter(img => 
        img.status === "completed" && img.code && img.senderName && img.phoneNumber
      );
      
      if (completedImages.length > 0) {
        saveToLocalStorage(completedImages);
      }
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
      
      // التأكد من تحديث حالة الصورة إلى "مكتملة" قبل الإرسال
      if (image.code && image.senderName && image.phoneNumber && image.status !== "completed") {
        updateImage(id, { status: "completed" });
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
