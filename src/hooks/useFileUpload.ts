
import { useState, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { compressImage } from "@/utils/imageCompression";
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";
import { useOcrProcessing } from "@/hooks/useOcrProcessing";
import { useGeminiProcessing } from "@/hooks/useGeminiProcessing";
import { useImageQueue } from "@/hooks/useImageQueue"; // استيراد نظام قائمة الانتظار

// المفتاح الرئيسي للاستخدام في Gemini API
import { DEFAULT_GEMINI_API_KEY } from "@/lib/gemini";

interface FileUploadProps {
  images: ImageData[];
  addImage: (image: ImageData) => void;
  updateImage: (id: string, data: Partial<ImageData>) => void;
  setProcessingProgress: (progress: number) => void;
  saveProcessedImage: (image: ImageData) => Promise<void>;
  isDuplicateImage: (image: ImageData, images: ImageData[]) => boolean;
  removeDuplicates: () => void;
}

export const useFileUpload = ({
  images,
  addImage,
  updateImage,
  setProcessingProgress,
  saveProcessedImage,
  isDuplicateImage,
  removeDuplicates
}: FileUploadProps) => {
  const [geminiEnabled, setGeminiEnabled] = useState(true);
  const { toast } = useToast();
  const { processWithOcr } = useOcrProcessing();
  const { processWithGemini } = useGeminiProcessing();
  
  // استخدام نظام قائمة الانتظار المحسن
  const { 
    addToQueue, 
    isProcessing, 
    queueLength, 
    activeUploads,
    manuallyTriggerProcessingQueue,
    clearQueue
  } = useImageQueue();
  
  // كاش لهاشات الصور التي تمت معالجتها لمنع المعالجة المتكررة
  const processedHashes = useRef<Set<string>>(new Set());
  
  // مسح كاش الهاشات
  const clearProcessedHashesCache = useCallback(() => {
    processedHashes.current.clear();
    toast({
      title: "تم المسح",
      description: "تم مسح ذاكرة التخزين المؤقت للصور المجهزة",
    });
  }, [toast]);

  // وظيفة معالجة صورة واحدة (OCR أو Gemini)
  const processImage = useCallback(async (image: ImageData) => {
    console.log(`بدء معالجة الصورة: ${image.id}`);
    
    try {
      // تحديث حالة الصورة إلى "جاري المعالجة"
      updateImage(image.id, {
        status: "processing",
        extractedText: "جاري استخراج النص من الصورة..."
      });
      
      // التحقق من وجود الملف
      if (!image.file) {
        throw new Error("ملف الصورة غير متاح");
      }
      
      // معالجة الصورة بناءً على الطريقة المختارة
      let processedImage: ImageData;
      
      // استخدام Gemini إذا كان مفعلاً
      if (geminiEnabled) {
        console.log(`معالجة الصورة ${image.id} باستخدام Gemini`);
        processedImage = await processWithGemini(image.file, image);
      } else {
        console.log(`معالجة الصورة ${image.id} باستخدام OCR`);
        processedImage = await processWithOcr(image.file, image);
      }
      
      // تأكد من أن البيانات المستخرجة مكتملة
      console.log(`البيانات المستخرجة للصورة ${image.id}:`, {
        code: processedImage.code,
        senderName: processedImage.senderName,
        phoneNumber: processedImage.phoneNumber,
        province: processedImage.province,
        price: processedImage.price,
        companyName: processedImage.companyName
      });
      
      // حفظ البيانات المستخرجة والصورة المعالجة
      await saveProcessedImage(processedImage);
      
      // إضافة هاش الصورة إلى الكاش إذا كان متاحاً
      if (processedImage.imageHash) {
        processedHashes.current.add(processedImage.imageHash);
      }
      
      // تحديث حالة الصورة بعد المعالجة
      updateImage(image.id, {
        status: "completed",
        extractedText: processedImage.extractedText,
        code: processedImage.code || "",
        senderName: processedImage.senderName || "",
        phoneNumber: processedImage.phoneNumber || "",
        province: processedImage.province || "",
        price: processedImage.price || "",
        companyName: processedImage.companyName || "",
        confidence: processedImage.confidence || 0,
        extractionMethod: processedImage.extractionMethod || "ocr"
      });
      
      console.log(`تمت معالجة الصورة بنجاح: ${image.id}`);
      return processedImage;
    } catch (error) {
      console.error(`خطأ في معالجة الصورة ${image.id}:`, error);
      
      // تحديث حالة الصورة إلى "خطأ" مع رسالة الخطأ
      updateImage(image.id, {
        status: "error",
        extractedText: `فشل في معالجة الصورة: ${error.message || "خطأ غير معروف"}`
      });
      
      // إعادة رمي الخطأ للتعامل معه في وظيفة القائمة
      throw error;
    }
  }, [geminiEnabled, processWithGemini, processWithOcr, saveProcessedImage, updateImage]);

  // معالج تغيير الملفات - عند رفع الصور
  // تم تحسين المنطق لمعالجة الصور واحدة تلو الأخرى
  const handleFileChange = useCallback(async (files: File[]) => {
    if (!files.length) return;
    
    const batchId = uuidv4(); // إنشاء معرف مجموعة للملفات المرفوعة معًا
    console.log(`تم استلام ${files.length} ملفات، معرف المجموعة: ${batchId}`);

    // التحقق من التكرار قبل المعالجة
    removeDuplicates();
    
    // مسح أي معالجة سابقة قد تكون متوقفة
    clearQueue();
    
    // مجموعة لتخزين معرفات الصور المضافة حديثاً
    const addedImageIds: string[] = [];
    
    // معالجة كل ملف على حدة وإضافته إلى قائمة الانتظار
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileNumber = i + 1;
      
      try {
        // ضغط الصورة أولاً
        const compressedFile = await compressImage(file);
        console.log(`تم ضغط الصورة ${fileNumber}/${files.length}، الحجم الجديد: ${compressedFile.size}`);
        
        // إنشاء عنوان URL مؤقت للعرض
        const previewUrl = URL.createObjectURL(compressedFile);
        
        // إنشاء كائن الصورة الجديد
        const newImage: ImageData = {
          id: uuidv4(),
          file: compressedFile,
          previewUrl,
          extractedText: "في انتظار المعالجة...",
          date: new Date(),
          status: "pending",
          batch_id: batchId,
          number: fileNumber,
          processingAttempts: 0
        };
        
        // التحقق من التكرار
        if (isDuplicateImage(newImage, images)) {
          console.log(`الصورة ${fileNumber} مكررة، تخطيها`);
          URL.revokeObjectURL(previewUrl);
          continue;
        }
        
        // إضافة الصورة إلى الحالة
        addImage(newImage);
        addedImageIds.push(newImage.id);
        
        // إضافة الصورة إلى قائمة انتظار المعالجة
        addToQueue(newImage.id, newImage, async () => {
          try {
            console.log(`بدء معالجة الصورة من القائمة: ${newImage.id}`);
            await processImage(newImage);
            // تحديث التقدم بعد معالجة كل صورة
            setProcessingProgress((fileNumber / files.length) * 100);
            // انتظار قصير للتأكد من تحديث واجهة المستخدم
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log(`اكتملت معالجة الصورة من القائمة: ${newImage.id}`);
            return Promise.resolve();
          } catch (error) {
            console.error(`فشل في معالجة الصورة ${newImage.id}:`, error);
            return Promise.reject(error);
          }
        });
      } catch (error) {
        console.error(`خطأ في معالجة الملف ${fileNumber}:`, error);
        toast({
          title: "خطأ في المعالجة",
          description: `فشل في معالجة الصورة ${fileNumber}: ${error.message || "خطأ غير معروف"}`,
          variant: "destructive"
        });
      }
    }
    
    // إظهار رسالة نجاح
    if (addedImageIds.length > 0) {
      toast({
        title: "تم الرفع",
        description: `تم إضافة ${addedImageIds.length} صورة إلى قائمة المعالجة`,
      });
    }
  }, [
    addImage, 
    addToQueue, 
    clearQueue,
    isDuplicateImage, 
    images, 
    processImage, 
    removeDuplicates, 
    setProcessingProgress, 
    toast
  ]);

  // تبديل استخدام Gemini
  const toggleGemini = useCallback((value: boolean) => {
    setGeminiEnabled(value);
  }, []);

  return {
    handleFileChange,
    isProcessing,
    useGemini: geminiEnabled,
    toggleGemini,
    manuallyTriggerProcessingQueue,
    clearProcessedHashesCache,
    activeUploads,
    queueLength,
    retryProcessing: manuallyTriggerProcessingQueue // تصدير وظيفة إعادة المحاولة
  };
};
